/**
 * API Route: /api/audit/samples
 *
 * GET  — List sampling sessions
 * POST — Generate a new sample (requires audit:manage or sampling:execute)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requireAnyPermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { auditSamples, controls } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  generateSample,
  calculateSampleSize,
  generateSampleCsv,
  SAMPLING_ENGINE_VERSION,
} from "@/lib/audit/sampling";
import type { RiskTier } from "@/lib/audit/sampling";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const samples = await db
      .select()
      .from(auditSamples)
      .orderBy(desc(auditSamples.createdAt));

    return Response.json({ samples });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission("audit:manage", "sampling:execute");

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      period?: string;
      controlId?: string;
      seed?: number;
      populationQuery?: string;
      population?: string[];
    };

    if (!body.period || !body.controlId) {
      return Response.json(
        { error: "Missing required fields: period, controlId" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Look up control to determine risk tier
    const controlRows = await db
      .select()
      .from(controls)
      .where(eq(controls.controlId, body.controlId))
      .limit(1);

    if (controlRows.length === 0) {
      return Response.json(
        { error: `Control "${body.controlId}" not found` },
        { status: 404 }
      );
    }

    const control = controlRows[0] as { riskTier: string; populationDefinition: string };
    const riskTier = control.riskTier as RiskTier;

    // Use provided population or generate a placeholder list based on populationQuery
    const population = body.population ?? [];
    if (population.length === 0) {
      return Response.json(
        { error: "Population array is required and must be non-empty" },
        { status: 400 }
      );
    }

    const seed = body.seed ?? Math.floor(Math.random() * 2147483647);
    const sampleSize = calculateSampleSize(riskTier, population.length);

    // Generate deterministic sample
    const result = generateSample({
      population,
      sampleSize,
      seed,
    });

    // Generate CSV metadata
    const sampledAt = new Date().toISOString();
    const programVersion = process.env.GIT_COMMIT_SHA ?? "dev";
    const csv = generateSampleCsv(result, {
      seed,
      populationSize: population.length,
      sampleSize: result.sampleSize,
      sampledAt,
      operator: session.user.id,
      programVersion,
    });

    // Save to database
    const id = nanoid(12);

    await db.insert(auditSamples).values({
      id,
      period: body.period,
      controlId: body.controlId,
      seed,
      populationQuery: body.populationQuery ?? control.populationDefinition,
      sampleSize: result.sampleSize,
      operator: session.user.id,
      programVersion,
      samplingEngineVersion: SAMPLING_ENGINE_VERSION,
    });

    return Response.json(
      {
        sample: {
          id,
          period: body.period,
          controlId: body.controlId,
          seed,
          sampleSize: result.sampleSize,
          populationSize: population.length,
          items: result.items,
          indices: result.indices,
          csv,
          createdAt: sampledAt,
        },
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
