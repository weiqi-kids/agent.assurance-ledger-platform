/**
 * API Route: /api/cases
 *
 * GET  — List cases for the authenticated user's tenant
 * POST — Create a new case (writes CASE_CREATED via writer.appendEvent)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { requireTenantMatch } from "@/lib/tenant/guard";
import { appendEvent, generateCaseId } from "@/lib/ledger/writer";
import { getDb } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return Response.json(
        { error: "User has no tenant assigned" },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const allCases = await db
      .select()
      .from(cases)
      .where(eq(cases.tenantId, tenantId))
      .orderBy(desc(cases.createdAt));

    if (statusFilter && statusFilter !== "all") {
      const filtered = (allCases as Array<{ status: string }>).filter(
        (c) => c.status === statusFilter
      );
      return Response.json({ cases: filtered });
    }

    return Response.json({ cases: allCases });
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
      title?: string;
      description?: string;
      tenantId?: string;
    };

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Use tenantId from body or session
    const tenantId = body.tenantId || session.user.tenantId;
    if (!tenantId) {
      return Response.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Enforce tenant boundary
    requireTenantMatch(session, tenantId);

    const caseId = generateCaseId();
    const actor = session.user.id;

    // Write CASE_CREATED event via the single writer
    const event = await appendEvent(tenantId, caseId, "CASE_CREATED", actor, {
      title: body.title.trim(),
      description: body.description?.trim() || null,
    });

    return Response.json(
      {
        case: {
          id: caseId,
          tenantId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          status: "draft",
          createdBy: actor,
          createdAt: event.timestamp,
        },
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
