/**
 * API Route: /api/audit/samples/[sampleId]
 *
 * GET   — Get a single sampling session with details
 * PATCH — Update test result for a sample (requires audit:manage or sampling:execute)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requireAnyPermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { auditSamples } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sampleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sampleId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(auditSamples)
      .where(eq(auditSamples.id, sampleId))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Sample not found" }, { status: 404 });
    }

    return Response.json({ sample: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sampleId: string }> }
) {
  try {
    await requireAnyPermission("audit:manage", "sampling:execute");

    const { sampleId } = await params;

    const body = (await request.json()) as {
      populationQuery?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Verify sample exists
    const existing = await db
      .select()
      .from(auditSamples)
      .where(eq(auditSamples.id, sampleId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json({ error: "Sample not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.populationQuery !== undefined) {
      updates.populationQuery = body.populationQuery;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db
      .update(auditSamples)
      .set(updates)
      .where(eq(auditSamples.id, sampleId));

    const updated = await db
      .select()
      .from(auditSamples)
      .where(eq(auditSamples.id, sampleId))
      .limit(1);

    return Response.json({ sample: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
