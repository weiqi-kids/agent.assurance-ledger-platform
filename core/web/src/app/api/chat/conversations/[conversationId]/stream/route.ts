/**
 * API Route: /api/chat/conversations/[conversationId]/stream
 *
 * POST — SSE streaming endpoint for AI responses.
 *
 * Parses @mentions, determines target providers, streams responses
 * using Server-Sent Events. Each chunk is formatted as:
 *   data: {"providerId":"xxx","content":"chunk","done":false}
 *
 * Final chunk per provider:
 *   data: {"providerId":"xxx","content":"","done":true}
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parseMessage, routeMessage } from "@/lib/ai/router";
import { getEnabledProviders } from "@/lib/ai/provider-registry";
import type { AIMessage } from "@/lib/ai/types";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;
  const body = (await request.json()) as { content?: string };

  if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
    return Response.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  // Verify ownership
  const conv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (conv.length === 0) {
    return Response.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();

  // Save user message
  const userMsgId = nanoid();
  await db.insert(messages).values({
    id: userMsgId,
    conversationId,
    role: "user",
    content: body.content.trim(),
    createdAt: now,
  });

  // Parse @mentions
  const parseResult = parseMessage(body.content);
  const providers = await getEnabledProviders();
  const targets = routeMessage(parseResult, providers);

  if (targets.length === 0) {
    // No AI targets — just return a simple SSE with done
    const stream = new ReadableStream({
      start(controller) {
        const data = JSON.stringify({
          providerId: null,
          content: "",
          done: true,
          userMessage: {
            id: userMsgId,
            conversationId,
            role: "user",
            content: body.content!.trim(),
            createdAt: now,
          },
        });
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Fetch conversation history
  const historyRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(50);

  historyRows.reverse();

  const aiMessages: AIMessage[] = historyRows.map(
    (row: { role: string; content: string }) => ({
      role: row.role as AIMessage["role"],
      content: row.content,
    })
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send the user message info first
        const userMsgData = JSON.stringify({
          type: "user_message",
          userMessage: {
            id: userMsgId,
            conversationId,
            role: "user",
            content: body.content!.trim(),
            createdAt: now,
          },
        });
        controller.enqueue(encoder.encode(`data: ${userMsgData}\n\n`));

        // Stream each provider's response sequentially
        for (const target of targets) {
          const aiMsgId = nanoid();
          let fullContent = "";

          try {
            // Send provider start marker
            const startData = JSON.stringify({
              type: "provider_start",
              providerId: target.providerId,
              providerName: target.adapter.providerName,
              model: target.adapter.model,
              messageId: aiMsgId,
            });
            controller.enqueue(encoder.encode(`data: ${startData}\n\n`));

            const generator = target.adapter.streamMessage(aiMessages);
            for await (const chunk of generator) {
              fullContent += chunk.content;
              const chunkData = JSON.stringify({
                providerId: target.providerId,
                content: chunk.content,
                done: chunk.done,
                messageId: aiMsgId,
              });
              controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
            }
          } catch (err) {
            const errorMsg =
              err instanceof Error ? err.message : "Unknown error";
            fullContent = `[Error from ${target.adapter.providerName}]: ${errorMsg}`;
            const errorData = JSON.stringify({
              providerId: target.providerId,
              content: fullContent,
              done: true,
              error: true,
              messageId: aiMsgId,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }

          // Save the AI response to DB
          await db.insert(messages).values({
            id: aiMsgId,
            conversationId,
            role: "assistant",
            content: fullContent,
            aiProviderId: target.providerId,
            createdAt: new Date().toISOString(),
          });
        }

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date().toISOString() })
          .where(eq(conversations.id, conversationId));

        // Signal end of all streams
        const endData = JSON.stringify({ type: "stream_end" });
        controller.enqueue(encoder.encode(`data: ${endData}\n\n`));
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Stream error";
        const errorData = JSON.stringify({
          type: "error",
          error: errorMsg,
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
