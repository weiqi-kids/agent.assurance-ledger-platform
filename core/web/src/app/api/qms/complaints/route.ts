/**
 * API Route: /api/qms/complaints
 *
 * GET  — List complaints with optional filters (status, severity)
 * POST — Create a new complaint (also creates a GitHub Issue)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { complaints } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createIssue } from "@/lib/github/issues";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(complaints.status, statusFilter));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(complaints)
      .where(where)
      .orderBy(complaints.createdAt);

    return Response.json({ complaints: rows });
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

    const body = (await request.json()) as {
      clientName?: string;
      description?: string;
    };

    if (!body.clientName || !body.description) {
      return Response.json(
        { error: "clientName and description are required" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const complaintId = `CMPL-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(complaints).values({
      id,
      clientName: body.clientName,
      description: body.description,
      status: "open",
      resolution: null,
      githubIssueNumber: null,
      createdAt: now,
      resolvedAt: null,
    });

    // Best-effort: create GitHub Issue
    try {
      const issue = await createIssue({
        title: `[Complaint] ${complaintId}: ${body.clientName}`,
        body: `### Complainant\n${body.clientName}\n\n### Description\n${body.description}`,
        labels: ["complaint"],
      });
      // Update the complaint record with the issue number
      await db
        .update(complaints)
        .set({ githubIssueNumber: issue.number })
        .where(eq(complaints.id, id));
    } catch {
      // Best-effort -- don't fail the complaint creation if GitHub is unavailable
    }

    const inserted = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, id));

    return Response.json({ complaint: inserted[0] }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
