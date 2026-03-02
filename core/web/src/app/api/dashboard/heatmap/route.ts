/**
 * API Route: /api/dashboard/heatmap
 *
 * GET — Returns control health heatmap data by domain
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { controls, findings } from "@/lib/db/schema";

interface ControlRow {
  controlId: string;
  domain: string;
}

interface FindingRow {
  controlId: string | null;
  severity: string;
  status: string;
}

const domainNames: Record<string, string> = {
  AC: "Access Control",
  CM: "Change Management",
  PI: "Process Integrity",
  CF: "Client Files",
  IR: "Incident Response",
  MN: "Monitoring",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const allControls = (await db.select().from(controls)) as ControlRow[];
    const allFindings = (await db.select().from(findings)) as FindingRow[];

    // Build findings index per control
    const openFindingsByControl = new Map<string, { medium: number; highCritical: number }>();

    for (const f of allFindings) {
      if (f.status !== "open" && f.status !== "remediation") continue;
      if (!f.controlId) continue;

      const existing = openFindingsByControl.get(f.controlId) ?? {
        medium: 0,
        highCritical: 0,
      };

      if (
        f.severity === "Material" ||
        f.severity === "Significant" ||
        f.severity === "critical" ||
        f.severity === "high"
      ) {
        existing.highCritical += 1;
      } else {
        existing.medium += 1;
      }

      openFindingsByControl.set(f.controlId, existing);
    }

    // Group by domain
    const domains = ["AC", "CM", "PI", "CF", "IR", "MN"];
    const heatmap = domains.map((domain) => {
      const domainControls = allControls.filter((c) => c.domain === domain);
      let noFindings = 0;
      let mediumFindings = 0;
      let highCriticalFindings = 0;

      for (const c of domainControls) {
        const f = openFindingsByControl.get(c.controlId);
        if (!f) {
          noFindings++;
        } else if (f.highCritical > 0) {
          highCriticalFindings++;
        } else {
          mediumFindings++;
        }
      }

      return {
        domain,
        domainName: domainNames[domain] ?? domain,
        controlCount: domainControls.length,
        noFindings,
        mediumFindings,
        highCriticalFindings,
      };
    });

    return Response.json({ heatmap });
  } catch (error) {
    return authErrorResponse(error);
  }
}
