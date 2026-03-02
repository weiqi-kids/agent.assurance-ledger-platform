/**
 * API Route: /api/settings/users
 *
 * GET — List all users (requires users:manage permission)
 * PATCH — Update a user's role (requires users:manage permission)
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission, authErrorResponse } from "@/lib/auth/guard";
import { isValidRole } from "@/lib/auth/roles";

export async function GET() {
  try {
    await requirePermission("users:manage");
  } catch (error) {
    return authErrorResponse(error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.email);

  return Response.json({ users: allUsers });
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("users:manage");
  } catch (error) {
    return authErrorResponse(error);
  }

  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, role } = body;

  if (!userId || typeof userId !== "string") {
    return Response.json(
      { error: "userId is required and must be a string" },
      { status: 400 }
    );
  }

  if (!role || typeof role !== "string") {
    return Response.json(
      { error: "role is required and must be a string" },
      { status: 400 }
    );
  }

  if (!isValidRole(role)) {
    return Response.json(
      {
        error: `Invalid role "${role}". Must be one of: engagement-partner, quality-manager, tech-lead, system-admin, auditor, viewer`,
      },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  // Verify user exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Update role
  await db
    .update(users)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));

  return Response.json({ success: true, userId, role });
}
