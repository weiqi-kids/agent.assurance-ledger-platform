/**
 * API Route: /api/cases/[caseId]
 *
 * GET — Get case detail with recent ledger events. Enforces tenant boundary.
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { requireTenantMatch } from "@/lib/tenant/guard";
import { getDb } from "@/lib/db";
import { cases, caseLedgerEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
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

    // Fetch the case
    const caseRows = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (caseRows.length === 0) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    const caseData = caseRows[0];

    // Enforce tenant boundary
    requireTenantMatch(session, caseData.tenantId);

    // Fetch recent ledger events (last 50)
    const events = await db
      .select()
      .from(caseLedgerEvents)
      .where(eq(caseLedgerEvents.caseId, caseId))
      .orderBy(desc(caseLedgerEvents.timestamp))
      .limit(50);

    return Response.json({
      case: caseData,
      events,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
