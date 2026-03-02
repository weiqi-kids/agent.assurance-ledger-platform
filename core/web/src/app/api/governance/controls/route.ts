import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { controls } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, authErrorResponse } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("governance:read");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = request.nextUrl;
  const domain = searchParams.get("domain");
  const riskTier = searchParams.get("riskTier");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  const conditions = [];
  if (domain) {
    conditions.push(eq(controls.domain, domain));
  }
  if (riskTier) {
    conditions.push(eq(controls.riskTier, riskTier));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(controls)
    .where(where)
    .orderBy(controls.controlId);

  return Response.json({ controls: results });
}
