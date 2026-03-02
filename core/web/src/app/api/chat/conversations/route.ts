/**
 * API Route: /api/chat/conversations
 *
 * GET  — List conversations for the authenticated user
 * POST — Create a new conversation
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, session.user.id))
      .orderBy(desc(conversations.updatedAt));

    // For each conversation, fetch the last message for preview
    const results = [];
    for (const conv of userConversations) {
      const lastMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      results.push({
        ...conv,
        lastMessage: lastMessages[0] ?? null,
      });
    }

    return Response.json({ conversations: results });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { title?: string };
    const title = body.title?.trim() || "New Conversation";
    const id = nanoid();
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(conversations).values({
      id,
      title,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    const created = {
      id,
      title,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    };

    return Response.json({ conversation: created }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
