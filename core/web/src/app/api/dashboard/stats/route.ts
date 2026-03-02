/**
 * API Route: /api/dashboard/stats
 *
 * GET — Returns summary statistics for the dashboard
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { cases, findings, controls, evidencePacks } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // --- Cases by status ---
    const allCases = await db.select().from(cases);
    const casesByStatus: Record<string, number> = {};
    let totalCases = 0;
    for (const c of allCases as Array<{ status: string }>) {
      casesByStatus[c.status] = (casesByStatus[c.status] ?? 0) + 1;
      totalCases++;
    }

    // --- Open findings by severity ---
    const allFindings = await db.select().from(findings);
    const openFindings: Record<string, number> = {};
    let totalOpenFindings = 0;
    for (const f of allFindings as Array<{ status: string; severity: string }>) {
      if (f.status === "open" || f.status === "remediation") {
        openFindings[f.severity] = (openFindings[f.severity] ?? 0) + 1;
        totalOpenFindings++;
      }
    }

    // --- Controls pass rate ---
    const controlRows = await db.select({ controlId: controls.controlId }).from(controls);
    const totalControls = (controlRows as Array<{ controlId: string }>).length;

    // Controls with open findings
    const controlsWithOpenFindings = new Set<string>();
    for (const f of allFindings as Array<{ status: string; controlId: string | null }>) {
      if ((f.status === "open" || f.status === "remediation") && f.controlId) {
        controlsWithOpenFindings.add(f.controlId);
      }
    }
    const passRate =
      totalControls > 0
        ? Math.round(
            ((totalControls - controlsWithOpenFindings.size) / totalControls) *
              100
          )
        : 100;

    // --- Evidence Packs ---
    const packRows = await db
      .select()
      .from(evidencePacks);
    const totalPacks = (packRows as Array<Record<string, unknown>>).length;

    // Get latest pack
    let latestPack: {
      period: string;
      status: string;
      generatedAt: string;
      signedBy: string | null;
    } | null = null;
    if (totalPacks > 0) {
      const sorted = (
        packRows as Array<{
          period: string;
          status: string;
          generatedAt: string;
          signedBy: string | null;
        }>
      ).sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() -
          new Date(a.generatedAt).getTime()
      );
      latestPack = sorted[0];
    }

    return Response.json({
      cases: {
        total: totalCases,
        byStatus: casesByStatus,
      },
      findings: {
        totalOpen: totalOpenFindings,
        bySeverity: openFindings,
      },
      controls: {
        total: totalControls,
        passRate,
        withOpenFindings: controlsWithOpenFindings.size,
      },
      evidencePacks: {
        total: totalPacks,
        latest: latestPack
          ? {
              period: latestPack.period,
              status: latestPack.status,
              generatedAt: latestPack.generatedAt,
              signed: !!latestPack.signedBy,
            }
          : null,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
