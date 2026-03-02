/**
 * API Route: /api/settings/system
 *
 * GET — List all system settings (requires settings:read permission)
 * PATCH — Update a system setting (requires settings:manage permission)
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  requirePermission,
  requireAuth,
  authErrorResponse,
} from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/roles";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!hasPermission(session.user.role, "settings:read")) {
      return Response.json(
        { error: "Forbidden: missing permission settings:read" },
        { status: 403 }
      );
    }
  } catch (error) {
    return authErrorResponse(error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  const settings = await db
    .select()
    .from(systemSettings)
    .orderBy(systemSettings.key);

  return Response.json({ settings });
}

export async function PATCH(request: NextRequest) {
  let session;
  try {
    session = await requirePermission("settings:manage");
  } catch (error) {
    return authErrorResponse(error);
  }

  let body: { key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { key, value } = body;

  if (!key || typeof key !== "string") {
    return Response.json(
      { error: "key is required and must be a string" },
      { status: 400 }
    );
  }

  if (value === undefined || value === null || typeof value !== "string") {
    return Response.json(
      { error: "value is required and must be a string" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  // Check if setting exists
  const existing = await db
    .select({ id: systemSettings.id })
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  const now = new Date().toISOString();

  if (existing.length > 0) {
    // Update existing setting
    await db
      .update(systemSettings)
      .set({
        value,
        updatedAt: now,
        updatedBy: session.user.id,
      })
      .where(eq(systemSettings.key, key));
  } else {
    // Insert new setting
    const id = `setting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(systemSettings).values({
      id,
      key,
      value,
      updatedAt: now,
      updatedBy: session.user.id,
    });
  }

  return Response.json({ success: true, key, value });
}
