/**
 * API Route: /api/cases/[caseId]/verify
 *
 * GET — Verify hash chain integrity for this case.
 *       Reads from the JSONL ledger file and verifies the full hash chain.
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { requireTenantMatch } from "@/lib/tenant/guard";
import { verifyChain, verifyDbConsistency } from "@/lib/ledger/engine";
import { getDb } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    // Fetch the case to verify tenant boundary
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

    // Verify the hash chain
    const chainResult = await verifyChain(caseData.tenantId, caseId);

    // Also verify DB consistency
    const consistencyResult = await verifyDbConsistency(
      caseData.tenantId,
      caseId
    );

    return Response.json({
      chain: chainResult,
      consistency: consistencyResult,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
