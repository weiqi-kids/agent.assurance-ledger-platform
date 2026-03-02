/**
 * API Route: /api/qms/complaints/[complaintId]
 *
 * GET   — Get single complaint
 * PATCH — Update complaint status/resolution
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { complaints } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { complaintId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // complaintId parameter matches the complaint record id
    const rows = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, complaintId));

    if (rows.length === 0) {
      return Response.json({ error: "Complaint not found" }, { status: 404 });
    }

    return Response.json({ complaint: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { complaintId } = await params;
    const body = (await request.json()) as {
      status?: string;
      resolution?: string;
      clientName?: string;
      description?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const existing = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, complaintId));

    if (existing.length === 0) {
      return Response.json({ error: "Complaint not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    if (body.status !== undefined) {
      const validStatuses = ["open", "investigating", "resolved", "closed"];
      if (!validStatuses.includes(body.status)) {
        return Response.json(
          { error: `status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
      if (body.status === "resolved" || body.status === "closed") {
        updates.resolvedAt = new Date().toISOString();
      }
    }
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.clientName !== undefined) updates.clientName = body.clientName;
    if (body.description !== undefined) updates.description = body.description;

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db
      .update(complaints)
      .set(updates)
      .where(eq(complaints.id, complaintId));

    const updated = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, complaintId));

    return Response.json({ complaint: updated[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}
