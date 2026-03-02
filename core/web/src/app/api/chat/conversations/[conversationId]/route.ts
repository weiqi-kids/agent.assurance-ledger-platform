/**
 * API Route: /api/chat/conversations/[conversationId]
 *
 * GET    — Get a single conversation with recent messages
 * DELETE — Delete a conversation
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

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

    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Return in chronological order
    recentMessages.reverse();

    return Response.json({
      conversation: conv[0],
      messages: recentMessages,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

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

    // Messages are cascade-deleted via FK constraint
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
