/**
 * API Route: /api/audit/findings/[findingId]
 *
 * GET   — Get a single finding by its human-readable findingId
 * PATCH — Update finding status/remediation (requires audit:manage)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requirePermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { findings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ findingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { findingId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(findings)
      .where(eq(findings.findingId, findingId))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Finding not found" }, { status: 404 });
    }

    return Response.json({ finding: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
) {
  try {
    await requirePermission("audit:manage");

    const { findingId } = await params;

    const body = (await request.json()) as {
      status?: string;
      managementResponseText?: string;
      auditorNotified?: boolean;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Verify finding exists
    const existing = await db
      .select()
      .from(findings)
      .where(eq(findings.findingId, findingId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json({ error: "Finding not found" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.status) {
      const validStatuses = ["open", "investigating", "remediated", "closed"];
      if (!validStatuses.includes(body.status)) {
        return Response.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
      if (body.status === "closed" || body.status === "remediated") {
        updates.resolvedAt = new Date().toISOString();
      }
    }

    if (body.managementResponseText !== undefined) {
      updates.managementResponseText = body.managementResponseText;
    }

    if (body.auditorNotified !== undefined) {
      updates.auditorNotified = body.auditorNotified ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db
      .update(findings)
      .set(updates)
      .where(eq(findings.findingId, findingId));

    const updated = await db
      .select()
      .from(findings)
      .where(eq(findings.findingId, findingId))
      .limit(1);

    return Response.json({ finding: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
