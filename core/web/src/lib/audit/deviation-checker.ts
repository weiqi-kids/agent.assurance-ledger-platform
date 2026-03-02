/**
 * Deviation Checker for audit findings.
 *
 * 5 deviation types:
 * - EVIDENCE_MISSING — Required evidence file not found
 * - SLA_EXCEEDED — Action took longer than SLA threshold
 * - APPROVAL_MISSING — Required approval not recorded
 * - HASH_MISMATCH — File hash doesn't match recorded hash
 * - REDACTION_ERROR — Redaction field missing or improperly masked
 */

import { computeFileHash } from "../../../../lib/hash";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const DEVIATION_TYPES = [
  "EVIDENCE_MISSING",
  "SLA_EXCEEDED",
  "APPROVAL_MISSING",
  "HASH_MISMATCH",
  "REDACTION_ERROR",
] as const;

export type DeviationType = (typeof DEVIATION_TYPES)[number];

export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface Deviation {
  type: DeviationType;
  description: string;
  controlId: string;
  severity: Severity;
}

export interface CheckResult {
  passed: boolean;
  deviation?: Deviation;
}

// ---------------------------------------------------------------------------
// Checkers
// ---------------------------------------------------------------------------

/**
 * Check if a required evidence file exists.
 */
export function checkEvidenceMissing(params: {
  controlId: string;
  filePath: string;
  fileExists: boolean;
  severity?: Severity;
}): CheckResult {
  if (params.fileExists) {
    return { passed: true };
  }

  return {
    passed: false,
    deviation: {
      type: "EVIDENCE_MISSING",
      description: `Required evidence file not found: ${params.filePath}`,
      controlId: params.controlId,
      severity: params.severity ?? "High",
    },
  };
}

/**
 * Check if an action was completed within SLA threshold.
 */
export function checkSlaExceeded(params: {
  controlId: string;
  actionDescription: string;
  startedAt: Date;
  completedAt: Date;
  slaHours: number;
  severity?: Severity;
}): CheckResult {
  const elapsedMs =
    params.completedAt.getTime() - params.startedAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours <= params.slaHours) {
    return { passed: true };
  }

  return {
    passed: false,
    deviation: {
      type: "SLA_EXCEEDED",
      description: `SLA exceeded for "${params.actionDescription}": took ${elapsedHours.toFixed(1)}h, threshold ${params.slaHours}h`,
      controlId: params.controlId,
      severity: params.severity ?? "Medium",
    },
  };
}

/**
 * Check if a required approval was recorded.
 */
export function checkApprovalMissing(params: {
  controlId: string;
  actionDescription: string;
  approvedBy: string | null | undefined;
  approvedAt: string | null | undefined;
  severity?: Severity;
}): CheckResult {
  if (params.approvedBy && params.approvedAt) {
    return { passed: true };
  }

  const missing: string[] = [];
  if (!params.approvedBy) missing.push("approver identity");
  if (!params.approvedAt) missing.push("approval timestamp");

  return {
    passed: false,
    deviation: {
      type: "APPROVAL_MISSING",
      description: `Required approval not recorded for "${params.actionDescription}": missing ${missing.join(", ")}`,
      controlId: params.controlId,
      severity: params.severity ?? "High",
    },
  };
}

/**
 * Check if a file's hash matches the expected recorded hash.
 */
export function checkHashMismatch(params: {
  controlId: string;
  filePath: string;
  fileContent: Buffer;
  expectedHash: string;
  severity?: Severity;
}): CheckResult {
  const actualHash = computeFileHash(params.fileContent);

  if (actualHash === params.expectedHash) {
    return { passed: true };
  }

  return {
    passed: false,
    deviation: {
      type: "HASH_MISMATCH",
      description: `File hash mismatch for "${params.filePath}": expected ${params.expectedHash}, got ${actualHash}`,
      controlId: params.controlId,
      severity: params.severity ?? "Critical",
    },
  };
}

/**
 * Check if redaction fields are properly masked.
 * Validates that specified fields are either absent or match the redaction pattern.
 */
export function checkRedactionError(params: {
  controlId: string;
  documentName: string;
  fields: Array<{ name: string; value: string | null | undefined }>;
  redactionPattern?: RegExp;
  severity?: Severity;
}): CheckResult {
  const pattern = params.redactionPattern ?? /^\[REDACTED\]$/;
  const failures: string[] = [];

  for (const field of params.fields) {
    if (field.value !== null && field.value !== undefined) {
      if (!pattern.test(field.value)) {
        failures.push(field.name);
      }
    }
  }

  if (failures.length === 0) {
    return { passed: true };
  }

  return {
    passed: false,
    deviation: {
      type: "REDACTION_ERROR",
      description: `Redaction field(s) improperly masked in "${params.documentName}": ${failures.join(", ")}`,
      controlId: params.controlId,
      severity: params.severity ?? "High",
    },
  };
}

/**
 * Run multiple deviation checks and collect all failures.
 */
export function runDeviationChecks(
  checks: CheckResult[]
): {
  allPassed: boolean;
  deviations: Deviation[];
} {
  const deviations: Deviation[] = [];
  for (const check of checks) {
    if (!check.passed && check.deviation) {
      deviations.push(check.deviation);
    }
  }
  return {
    allPassed: deviations.length === 0,
    deviations,
  };
}
