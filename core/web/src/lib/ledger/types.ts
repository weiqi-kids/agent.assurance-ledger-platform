/**
 * Ledger event types and interfaces for the event sourcing system.
 */

/** All valid ledger event types */
export type LedgerEventType =
  | "CASE_CREATED"
  | "STATUS_CHANGED"
  | "NOTE_ADDED"
  | "DOCUMENT_ATTACHED"
  | "DOCUMENT_REMOVED"
  | "ASSIGNMENT_CHANGED"
  | "FINDING_LINKED"
  | "FINDING_UNLINKED"
  | "REVIEW_REQUESTED"
  | "REVIEW_COMPLETED"
  | "CASE_DELIVERED"
  | "CASE_ARCHIVED";

/** Valid case statuses */
export type CaseStatus =
  | "draft"
  | "active"
  | "review"
  | "delivered"
  | "archived";

/** A ledger event as stored in JSONL and projected to the DB */
export interface LedgerEvent {
  event_type: LedgerEventType;
  timestamp: string;
  actor: string;
  event_hash: string;
  prev_hash: string;
  event_schema_version: string;
  tenant_id: string;
  case_id: string;
  payload: Record<string, unknown>;
}

/** Result of hash chain verification */
export interface VerificationResult {
  valid: boolean;
  eventCount: number;
  error?: string;
  brokenAtIndex?: number;
}

/** Result of DB consistency check */
export interface ConsistencyResult {
  consistent: boolean;
  ledgerEventCount: number;
  dbEventCount: number;
  missingInDb: string[];
  extraInDb: string[];
}

/** Result of replaying events from JSONL to DB */
export interface ReplayResult {
  success: boolean;
  eventsReplayed: number;
  errors: string[];
}
