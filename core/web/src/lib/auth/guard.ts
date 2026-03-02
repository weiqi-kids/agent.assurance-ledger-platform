import { auth } from "@/auth";
import { hasPermission, hasAnyPermission } from "@/lib/auth/roles";
import type { Role } from "@/lib/auth/roles";

/**
 * Get the current authenticated session. Returns null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require a specific role. Throws if user doesn't have the role.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return session;
}

/**
 * Require a specific permission. Throws if user doesn't have it.
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
  return session;
}

/**
 * Require any of the specified permissions.
 */
export async function requireAnyPermission(...permissions: string[]) {
  const session = await requireAuth();
  if (!hasAnyPermission(session.user.role, permissions)) {
    throw new Error("Forbidden: missing required permissions");
  }
  return session;
}

/**
 * Build a JSON error response for API routes.
 */
export function authErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Authentication required";
  const status = message.startsWith("Forbidden") ? 403 : 401;
  return Response.json({ error: message }, { status });
}
