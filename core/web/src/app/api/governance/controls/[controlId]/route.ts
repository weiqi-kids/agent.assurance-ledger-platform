import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { controls } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission, authErrorResponse } from "@/lib/auth/guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ controlId: string }> }
) {
  try {
    await requirePermission("governance:read");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { controlId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  const results = await db
    .select()
    .from(controls)
    .where(eq(controls.controlId, controlId))
    .limit(1);

  if (results.length === 0) {
    return Response.json(
      { error: `Control "${controlId}" not found` },
      { status: 404 }
    );
  }

  return Response.json({ control: results[0] });
}
