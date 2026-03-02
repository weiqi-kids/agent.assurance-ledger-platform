/**
 * Tenant boundary enforcement.
 *
 * All API routes that operate on tenant-scoped data MUST call
 * requireTenantMatch() before processing the request.
 */

/**
 * Verify that the user's tenant matches the requested tenant.
 * Returns true if access is allowed, false otherwise.
 */
export function verifyTenantAccess(
  userTenantId: string | null | undefined,
  requestedTenantId: string
): boolean {
  if (!userTenantId) return false;
  return userTenantId === requestedTenantId;
}

/**
 * Require that the session user's tenant matches the requested tenant.
 * Throws an error if the tenant boundary is violated.
 */
export function requireTenantMatch(
  session: { user: { tenantId?: string | null } },
  tenantId: string
): void {
  if (!verifyTenantAccess(session.user.tenantId, tenantId)) {
    throw new Error(
      `Forbidden: tenant boundary violation. User tenant "${session.user.tenantId ?? "none"}" cannot access tenant "${tenantId}".`
    );
  }
}
