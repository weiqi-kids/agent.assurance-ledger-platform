/**
 * API Route: /api/cases/[caseId]/events
 *
 * GET  — List all ledger events for the case (from DB projection)
 * POST — Add a new event (STATUS_CHANGED, NOTE_ADDED, etc.) via writer.appendEvent
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { requireTenantMatch } from "@/lib/tenant/guard";
import { appendEvent } from "@/lib/ledger/writer";
import { getDb } from "@/lib/db";
import { cases, caseLedgerEvents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { LedgerEventType } from "@/lib/ledger/types";

/** Event types that can be posted via this endpoint */
const ALLOWED_EVENT_TYPES: LedgerEventType[] = [
  "STATUS_CHANGED",
  "NOTE_ADDED",
  "DOCUMENT_ATTACHED",
  "DOCUMENT_REMOVED",
  "ASSIGNMENT_CHANGED",
  "FINDING_LINKED",
  "FINDING_UNLINKED",
  "REVIEW_REQUESTED",
  "REVIEW_COMPLETED",
  "CASE_DELIVERED",
  "CASE_ARCHIVED",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Fetch the case to verify tenant boundary
    const caseRows = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (caseRows.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    requireTenantMatch(session, caseRows[0].tenantId);

    // Fetch all events in chronological order
    const events = await db
      .select()
      .from(caseLedgerEvents)
      .where(eq(caseLedgerEvents.caseId, caseId))
      .orderBy(asc(caseLedgerEvents.timestamp));

    return Response.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = await params;
    const body = (await request.json()) as {
      eventType?: string;
      payload?: Record<string, unknown>;
    };

    if (!body.eventType) {
      return Response.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_EVENT_TYPES.includes(body.eventType as LedgerEventType)) {
      return Response.json(
        {
          error: `Invalid eventType: "${body.eventType}". Allowed: ${ALLOWED_EVENT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Fetch the case to verify tenant boundary and existence
    const caseRows = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (caseRows.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const caseData = caseRows[0];
    requireTenantMatch(session, caseData.tenantId);

    const actor = session.user.id;
    const eventType = body.eventType as LedgerEventType;
    const payload = body.payload ?? {};

    // Write event via the single writer
    const event = await appendEvent(
      caseData.tenantId,
      caseId,
      eventType,
      actor,
      payload
    );

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
