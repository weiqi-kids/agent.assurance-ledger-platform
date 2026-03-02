/**
 * API Route: /api/dashboard/activity
 *
 * GET — Returns recent activity feed from case ledger events
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { caseLedgerEvents, cases } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

interface EventRow {
  id: string;
  caseId: string;
  eventType: string;
  actor: string;
  timestamp: string;
}

interface CaseRow {
  id: string;
  title: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Fetch recent events
    const events = (await db
      .select()
      .from(caseLedgerEvents)
      .orderBy(desc(caseLedgerEvents.timestamp))
      .limit(20)) as EventRow[];

    // Fetch case titles for the events
    const caseIds = [...new Set(events.map((e) => e.caseId))];
    const caseTitleMap = new Map<string, string>();

    for (const caseId of caseIds) {
      const caseRows = (await db
        .select({ id: cases.id, title: cases.title })
        .from(cases)
        .where(eq(cases.id, caseId))) as CaseRow[];
      if (caseRows.length > 0) {
        caseTitleMap.set(caseId, caseRows[0].title);
      }
    }

    const activity = events.map((e) => ({
      eventType: e.eventType,
      caseTitle: caseTitleMap.get(e.caseId) ?? "Unknown Case",
      actor: e.actor,
      timestamp: e.timestamp,
    }));

    return Response.json({ activity });
  } catch (error) {
    return authErrorResponse(error);
  }
}
