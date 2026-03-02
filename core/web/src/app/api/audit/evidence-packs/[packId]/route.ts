/**
 * API Route: /api/audit/evidence-packs/[packId]
 *
 * GET   — Get a single evidence pack with manifest details
 * PATCH — Sign the pack (requires audit:sign, Quality Manager only)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requirePermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { evidencePacks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(evidencePacks)
      .where(eq(evidencePacks.id, packId))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Evidence pack not found" }, { status: 404 });
    }

    return Response.json({ pack: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    // Only Quality Manager (or those with audit:sign) can sign packs
    const session = await requirePermission("audit:sign");

    const { packId } = await params;

    const body = (await request.json()) as {
      action?: string;
    };

    if (body.action !== "sign") {
      return Response.json(
        { error: 'Only "sign" action is supported' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Verify pack exists
    const existing = await db
      .select()
      .from(evidencePacks)
      .where(eq(evidencePacks.id, packId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json(
        { error: "Evidence pack not found" },
        { status: 404 }
      );
    }

    const pack = existing[0] as { status: string };
    if (pack.status === "signed") {
      return Response.json(
        { error: "Pack is already signed" },
        { status: 409 }
      );
    }

    const signedAt = new Date().toISOString();

    await db
      .update(evidencePacks)
      .set({
        signedBy: session.user.id,
        approvalTimestamp: signedAt,
        status: "signed",
      })
      .where(eq(evidencePacks.id, packId));

    const updated = await db
      .select()
      .from(evidencePacks)
      .where(eq(evidencePacks.id, packId))
      .limit(1);

    return Response.json({ pack: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
