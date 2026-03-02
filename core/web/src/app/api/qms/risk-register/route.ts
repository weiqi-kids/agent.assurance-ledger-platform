/**
 * API Route: /api/qms/risk-register
 *
 * GET  — List risk register entries with optional filters (status, domain)
 * POST — Create a new risk register entry
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { riskRegisters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RiskRow {
  riskId: string;
  linkedControls: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");
    const domainFilter = searchParams.get("domain");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(riskRegisters.status, statusFilter));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let rows = await db.select().from(riskRegisters).where(where).orderBy(riskRegisters.riskId);

    // Domain filter: filter by linked control prefix
    if (domainFilter) {
      rows = (rows as RiskRow[]).filter((r: RiskRow) => {
        try {
          const linked = JSON.parse(r.linkedControls) as string[];
          return linked.some((c: string) => c.startsWith(domainFilter + "-"));
        } catch {
          return false;
        }
      });
    }

    return Response.json({ risks: rows });
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
      riskId?: string;
      description?: string;
      linkedControls?: string[];
      likelihood?: number;
      impact?: number;
      mitigationStrategy?: string;
      residualRiskJustification?: string;
      reviewCycle?: string;
      kriThreshold?: number;
    };

    if (!body.description || !body.likelihood || !body.impact || !body.mitigationStrategy) {
      return Response.json(
        { error: "description, likelihood, impact, and mitigationStrategy are required" },
        { status: 400 }
      );
    }

    if (body.likelihood < 1 || body.likelihood > 5 || body.impact < 1 || body.impact > 5) {
      return Response.json(
        { error: "likelihood and impact must be between 1 and 5" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const riskId = body.riskId || `RISK-${nanoid(6).toUpperCase()}`;
    const riskScore = body.likelihood * body.impact;
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(riskRegisters).values({
      id,
      riskId,
      description: body.description,
      linkedControls: JSON.stringify(body.linkedControls ?? []),
      likelihood: body.likelihood,
      impact: body.impact,
      riskScore,
      mitigationStrategy: body.mitigationStrategy,
      residualRiskJustification: body.residualRiskJustification ?? "",
      reviewCycle: body.reviewCycle ?? "Quarterly",
      kriThreshold: body.kriThreshold ?? null,
      kriLastValue: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await db
      .select()
      .from(riskRegisters)
      .where(eq(riskRegisters.id, id));

    return Response.json({ risk: inserted[0] }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
