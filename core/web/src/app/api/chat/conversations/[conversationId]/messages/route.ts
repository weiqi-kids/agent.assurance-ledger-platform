/**
 * API Route: /api/chat/conversations/[conversationId]/messages
 *
 * GET  — List messages for a conversation (with pagination)
 * POST — Send a new message, process @mentions, call AI, save responses
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parseMessage, routeMessage } from "@/lib/ai/router";
import { getEnabledProviders } from "@/lib/ai/provider-registry";
import type { AIMessage } from "@/lib/ai/types";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0");

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

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Return in chronological order
    allMessages.reverse();

    return Response.json({ messages: allMessages });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
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

    // 1. Save user message
    const userMsgId = nanoid();
    await db.insert(messages).values({
      id: userMsgId,
      conversationId,
      role: "user",
      content: body.content.trim(),
      createdAt: now,
    });

    const savedUserMsg = {
      id: userMsgId,
      conversationId,
      role: "user" as string,
      content: body.content.trim(),
      aiProviderId: null as string | null,
      createdAt: now,
    };

    // 2. Parse @mentions
    const parseResult = parseMessage(body.content);
    const providers = await getEnabledProviders();
    const targets = routeMessage(parseResult, providers);

    const newMessages: Array<typeof savedUserMsg> = [savedUserMsg];

    // 3. If there are AI targets, fetch history and call each one
    if (targets.length > 0) {
      // Fetch conversation history for context
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

      // 4. For each target, call adapter.send()
      for (const target of targets) {
        try {
          const responseText = await target.adapter.send(aiMessages);
          const aiMsgId = nanoid();
          const aiNow = new Date().toISOString();

          await db.insert(messages).values({
            id: aiMsgId,
            conversationId,
            role: "assistant",
            content: responseText,
            aiProviderId: target.providerId,
            createdAt: aiNow,
          });

          newMessages.push({
            id: aiMsgId,
            conversationId,
            role: "assistant" as const,
            content: responseText,
            aiProviderId: target.providerId,
            createdAt: aiNow,
          });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Unknown error";
          const aiMsgId = nanoid();
          const aiNow = new Date().toISOString();

          await db.insert(messages).values({
            id: aiMsgId,
            conversationId,
            role: "assistant",
            content: `[Error from ${target.adapter.providerName}]: ${errorMsg}`,
            aiProviderId: target.providerId,
            createdAt: aiNow,
          });

          newMessages.push({
            id: aiMsgId,
            conversationId,
            role: "assistant" as const,
            content: `[Error from ${target.adapter.providerName}]: ${errorMsg}`,
            aiProviderId: target.providerId,
            createdAt: aiNow,
          });
        }
      }
    }

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));

    return Response.json({ messages: newMessages });
  } catch (error) {
    return authErrorResponse(error);
  }
}
