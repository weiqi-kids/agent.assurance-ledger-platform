/**
 * API Route: /api/qms/risk-register/[riskId]
 *
 * GET   — Get single risk register entry
 * PATCH — Update risk register entry
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { riskRegisters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ riskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(riskRegisters)
      .where(eq(riskRegisters.riskId, riskId));

    if (rows.length === 0) {
      return Response.json({ error: "Risk not found" }, { status: 404 });
    }

    return Response.json({ risk: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ riskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId } = await params;
    const body = (await request.json()) as {
      description?: string;
      linkedControls?: string[];
      likelihood?: number;
      impact?: number;
      mitigationStrategy?: string;
      residualRiskJustification?: string;
      reviewCycle?: string;
      kriThreshold?: number;
      kriLastValue?: number;
      status?: string;
      riskAcceptanceApproval?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const existing = await db
      .select()
      .from(riskRegisters)
      .where(eq(riskRegisters.riskId, riskId));

    if (existing.length === 0) {
      return Response.json({ error: "Risk not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.description !== undefined) updates.description = body.description;
    if (body.linkedControls !== undefined)
      updates.linkedControls = JSON.stringify(body.linkedControls);
    if (body.likelihood !== undefined) updates.likelihood = body.likelihood;
    if (body.impact !== undefined) updates.impact = body.impact;
    if (body.likelihood !== undefined || body.impact !== undefined) {
      const l = body.likelihood ?? (existing[0] as { likelihood: number }).likelihood;
      const i = body.impact ?? (existing[0] as { impact: number }).impact;
      updates.riskScore = l * i;
    }
    if (body.mitigationStrategy !== undefined)
      updates.mitigationStrategy = body.mitigationStrategy;
    if (body.residualRiskJustification !== undefined)
      updates.residualRiskJustification = body.residualRiskJustification;
    if (body.reviewCycle !== undefined) updates.reviewCycle = body.reviewCycle;
    if (body.kriThreshold !== undefined) updates.kriThreshold = body.kriThreshold;
    if (body.kriLastValue !== undefined) updates.kriLastValue = body.kriLastValue;
    if (body.status !== undefined) updates.status = body.status;
    if (body.riskAcceptanceApproval !== undefined)
      updates.riskAcceptanceApproval = body.riskAcceptanceApproval;

    await db
      .update(riskRegisters)
      .set(updates)
      .where(eq(riskRegisters.riskId, riskId));

    const updated = await db
      .select()
      .from(riskRegisters)
      .where(eq(riskRegisters.riskId, riskId));

    return Response.json({ risk: updated[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}
