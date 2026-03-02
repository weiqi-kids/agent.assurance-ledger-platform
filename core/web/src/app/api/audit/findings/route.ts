/**
 * API Route: /api/audit/findings
 *
 * GET  — List findings with optional filters (severity, status, controlId)
 * POST — Create a new finding (requires audit:manage)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requirePermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { findings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const severityFilter = searchParams.get("severity");
    const statusFilter = searchParams.get("status");
    const controlIdFilter = searchParams.get("controlId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const allFindings = await db
      .select()
      .from(findings)
      .orderBy(desc(findings.createdAt));

    // Apply filters in-memory (simple approach for SQLite compatibility)
    interface FindingRow {
      severity: string;
      status: string;
      controlId: string | null;
    }
    let filtered = allFindings as FindingRow[];

    if (severityFilter && severityFilter !== "all") {
      filtered = filtered.filter(
        (f: FindingRow) => f.severity === severityFilter
      );
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (f: FindingRow) => f.status === statusFilter
      );
    }
    if (controlIdFilter && controlIdFilter !== "all") {
      filtered = filtered.filter(
        (f: FindingRow) => f.controlId === controlIdFilter
      );
    }

    return Response.json({ findings: filtered });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("audit:manage");

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      controlId?: string;
      caseId?: string;
      severity?: string;
      description?: string;
      detectionMethod?: string;
      controlEffectivenessImpact?: string;
    };

    if (!body.severity || !body.description || !body.detectionMethod || !body.controlEffectivenessImpact) {
      return Response.json(
        { error: "Missing required fields: severity, description, detectionMethod, controlEffectivenessImpact" },
        { status: 400 }
      );
    }

    const id = nanoid(12);
    const findingId = `FND-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(findings).values({
      id,
      findingId,
      controlId: body.controlId || null,
      caseId: body.caseId || null,
      severity: body.severity,
      status: "open",
      description: body.description,
      detectionMethod: body.detectionMethod,
      controlEffectivenessImpact: body.controlEffectivenessImpact,
      auditorNotified: 0,
    });

    const rows = await db
      .select()
      .from(findings)
      .where(eq(findings.id, id))
      .limit(1);

    return Response.json({ finding: rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
