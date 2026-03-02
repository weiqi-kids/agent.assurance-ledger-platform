import { requirePermission, authErrorResponse } from "@/lib/auth/guard";
import { ROLES } from "@/lib/auth/roles";

const ROLE_DETAILS: Record<
  string,
  { description: string; permissions: string[] }
> = {
  "engagement-partner": {
    description:
      "Senior oversight with final approval authority over deliverables, findings, and governance decisions.",
    permissions: [
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
  },
  "quality-manager": {
    description:
      "QMS governance owner responsible for evidence signing, sampling oversight, and quality assurance.",
    permissions: [
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
  },
  "tech-lead": {
    description:
      "System architecture owner responsible for code review, CI/CD, and technical implementation.",
    permissions: [
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
  },
  "system-admin": {
    description:
      "Infrastructure and user management administrator for platform configuration and operations.",
    permissions: [
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
  },
  auditor: {
    description:
      "Read-only access for audit testing, re-performance, and sampling execution.",
    permissions: [
      "cases:read",
      "findings:read",
      "governance:read",
      "audit:read",
      "qms:read",
      "sampling:execute",
    ],
  },
  viewer: {
    description:
      "Basic read-only access for clients, stakeholders, and external observers.",
    permissions: [
      "cases:read",
      "findings:read",
      "governance:read",
      "audit:read",
      "qms:read",
    ],
  },
};

export async function GET() {
  try {
    await requirePermission("governance:read");
  } catch (error) {
    return authErrorResponse(error);
  }

  const roles = ROLES.map((role) => ({
    role,
    ...ROLE_DETAILS[role],
  }));

  return Response.json({ roles });
}
