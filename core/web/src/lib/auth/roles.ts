/**
 * Role definitions for the Assurance Ledger Platform.
 *
 * 6 roles matching the governance role-matrix:
 * - engagement-partner: Senior oversight, approval authority
 * - quality-manager: QMS governance, evidence signing, sampling oversight
 * - tech-lead: System architecture, code review, CI/CD
 * - system-admin: User management, infrastructure, configuration
 * - auditor: Read-only access for audit testing and re-performance
 * - viewer: Basic read-only access (clients, stakeholders)
 */

export const ROLES = [
  "engagement-partner",
  "quality-manager",
  "tech-lead",
  "system-admin",
  "auditor",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

/** Permission categories for role-based access control */
const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  "engagement-partner": [
    "cases:read",
    "cases:create",
    "cases:approve",
    "cases:deliver",
    "findings:read",
    "findings:manage",
    "governance:read",
    "governance:manage",
    "audit:read",
    "audit:manage",
    "qms:read",
    "qms:manage",
    "chat:use",
    "settings:read",
    "complaints:manage",
  ],
  "quality-manager": [
    "cases:read",
    "cases:create",
    "cases:approve",
    "findings:read",
    "findings:manage",
    "governance:read",
    "governance:manage",
    "audit:read",
    "audit:manage",
    "audit:sign",
    "qms:read",
    "qms:manage",
    "chat:use",
    "settings:read",
    "sampling:execute",
  ],
  "tech-lead": [
    "cases:read",
    "cases:create",
    "findings:read",
    "findings:manage",
    "governance:read",
    "audit:read",
    "qms:read",
    "chat:use",
    "settings:read",
    "settings:manage",
  ],
  "system-admin": [
    "cases:read",
    "findings:read",
    "governance:read",
    "audit:read",
    "qms:read",
    "chat:use",
    "settings:read",
    "settings:manage",
    "users:manage",
  ],
  auditor: [
    "cases:read",
    "findings:read",
    "governance:read",
    "audit:read",
    "qms:read",
    "sampling:execute",
  ],
  viewer: [
    "cases:read",
    "findings:read",
    "governance:read",
    "audit:read",
    "qms:read",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}
