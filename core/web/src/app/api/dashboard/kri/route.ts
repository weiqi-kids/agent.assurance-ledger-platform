/**
 * API Route: /api/dashboard/kri
 *
 * GET — Returns KRI (Key Risk Indicator) trend data grouped by domain
 */
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { riskRegisters } from "@/lib/db/schema";

interface RiskRow {
  riskId: string;
  linkedControls: string;
  kriThreshold: number | null;
  kriLastValue: number | null;
  status: string;
}

const DOMAINS = ["AC", "CM", "PI", "CF", "IR", "MN"];

const domainNames: Record<string, string> = {
  AC: "Access Control",
  CM: "Change Mgmt",
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

    const rows = (await db.select().from(riskRegisters)) as RiskRow[];

    // Group by domain prefix extracted from linkedControls
    const domainKri: Record<string, { thresholdSum: number; currentSum: number; count: number }> = {};

    for (const domain of DOMAINS) {
      domainKri[domain] = { thresholdSum: 0, currentSum: 0, count: 0 };
    }

    for (const row of rows) {
      if (row.kriThreshold === null || row.kriLastValue === null) continue;

      // Try to extract domain from linkedControls JSON array
      let linkedDomain: string | null = null;
      try {
        const linked = JSON.parse(row.linkedControls) as string[];
        if (linked.length > 0) {
          // Control IDs are like "AC-001", extract prefix
          const match = linked[0].match(/^([A-Z]{2})-/);
          if (match) {
            linkedDomain = match[1];
          }
        }
      } catch {
        // Try direct prefix from riskId
        const match = row.riskId.match(/^([A-Z]{2})-/);
        if (match) {
          linkedDomain = match[1];
        }
      }

      if (linkedDomain && domainKri[linkedDomain]) {
        domainKri[linkedDomain].thresholdSum += row.kriThreshold;
        domainKri[linkedDomain].currentSum += row.kriLastValue;
        domainKri[linkedDomain].count += 1;
      }
    }

    const data = DOMAINS.map((domain) => {
      const d = domainKri[domain];
      return {
        domain: `${domain} (${domainNames[domain]})`,
        threshold: d.count > 0 ? Math.round((d.thresholdSum / d.count) * 100) / 100 : 0,
        current: d.count > 0 ? Math.round((d.currentSum / d.count) * 100) / 100 : 0,
      };
    });

    return Response.json({ kri: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
