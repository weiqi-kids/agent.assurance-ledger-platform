/**
 * API Route: /api/audit/evidence-packs
 *
 * GET  — List evidence packs
 * POST — Generate a new evidence pack (requires audit:manage)
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  requirePermission,
  authErrorResponse,
} from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { evidencePacks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const packs = await db
      .select()
      .from(evidencePacks)
      .orderBy(desc(evidencePacks.generatedAt));

    return Response.json({ packs });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("audit:manage");

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      period?: string;
    };

    if (!body.period) {
      return Response.json(
        { error: "Missing required field: period" },
        { status: 400 }
      );
    }

    const id = nanoid(12);
    const generatedAt = new Date().toISOString();

    // For now, create a draft pack record.
    // The actual ZIP generation would be triggered separately or in a background job
    // when artifact files are gathered from the filesystem.
    const packHash = `sha256:draft-${id}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(evidencePacks).values({
      id,
      period: body.period,
      generatedAt,
      generatedBy: session.user.id,
      artifactCount: 0,
      packHash,
      status: "draft",
    });

    const rows = await db
      .select()
      .from(evidencePacks)
      .where(eq(evidencePacks.id, id))
      .limit(1);

    return Response.json({ pack: rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return authErrorResponse(error);
  }
}
