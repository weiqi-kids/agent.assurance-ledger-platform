/**
 * Single Writer for ledger events.
 *
 * ALL ledger writes MUST go through this module.
 * API routes MUST call appendEvent() — NEVER insert directly.
 *
 * Write order (event sourcing):
 * 1. Acquire async mutex (in-process concurrency safety)
 * 2. Read prev_hash from last JSONL line (or GENESIS_HASH for first event)
 * 3. Compute event_hash = SHA256(canonicalize(event_without_hash) + prev_hash)
 * 4. REPO FIRST: Append JSON line to ledger/cases/{tenantId}/{caseId}/events.jsonl
 * 5. DB SECOND: INSERT into caseLedgerEvents + UPDATE cases table
 * 6. If DB fails -> log PROJECTION_UPDATE_FAILED incident, push to retry queue
 * 7. Release mutex
 */
import * as fs from "fs";
import * as path from "path";
import { computeEventHash, GENESIS_HASH } from "./hash";
import { getProjector } from "./projectors/registry";
import { addToRetryQueue } from "./projection-retry";
import { getDb } from "@/lib/db";
import { createIncidentIssue } from "@/lib/github/issues";
import type { LedgerEvent, LedgerEventType } from "./types";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Async Mutex — ensures single-writer semantics within the process
// ---------------------------------------------------------------------------
class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

const mutex = new AsyncMutex();

/** Current event schema version */
const EVENT_SCHEMA_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Get the absolute path to a case's events.jsonl file.
 * From core/web/ (process.cwd()), the ledger is at ../../ledger/
 */
function getEventsFilePath(tenantId: string, caseId: string): string {
  return path.join(
    process.cwd(),
    "..",
    "..",
    "ledger",
    "cases",
    tenantId,
    caseId,
    "events.jsonl"
  );
}

/**
 * Read the prev_hash from the last event in a JSONL file.
 * Returns GENESIS_HASH if the file does not exist or is empty.
 */
function readPrevHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return GENESIS_HASH;
  }

  const content = fs.readFileSync(filePath, "utf-8").trimEnd();
  if (!content) {
    return GENESIS_HASH;
  }

  const lines = content.split("\n");
  const lastLine = lines[lines.length - 1];
  if (!lastLine) {
    return GENESIS_HASH;
  }

  try {
    const lastEvent = JSON.parse(lastLine) as LedgerEvent;
    return lastEvent.event_hash;
  } catch {
    // Corrupted last line — treat as genesis (chain verification will catch this)
    console.error(
      `[writer] Failed to parse last JSONL line at ${filePath}. Using GENESIS_HASH.`
    );
    return GENESIS_HASH;
  }
}

/**
 * Ensure the directory for a JSONL file exists.
 */
function ensureDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Append a new event to the ledger.
 *
 * This is the ONLY way to write ledger events. All API routes MUST use this function.
 *
 * @param tenantId - Tenant that owns the case
 * @param caseId - Case to append the event to
 * @param eventType - Type of the event (e.g. CASE_CREATED, STATUS_CHANGED)
 * @param actor - User ID of the actor
 * @param payload - Event-specific payload data
 * @returns The complete ledger event (with computed hash)
 */
export async function appendEvent(
  tenantId: string,
  caseId: string,
  eventType: LedgerEventType,
  actor: string,
  payload: Record<string, unknown>
): Promise<LedgerEvent> {
  await mutex.acquire();

  try {
    const filePath = getEventsFilePath(tenantId, caseId);

    // 1. Read prev_hash from last JSONL line (or GENESIS_HASH)
    const prevHash = readPrevHash(filePath);

    // 2. Build event object (without event_hash)
    const timestamp = new Date().toISOString();
    const eventWithoutHash: Omit<LedgerEvent, "event_hash"> = {
      event_type: eventType,
      timestamp,
      actor,
      prev_hash: prevHash,
      event_schema_version: EVENT_SCHEMA_VERSION,
      tenant_id: tenantId,
      case_id: caseId,
      payload,
    };

    // 3. Compute event_hash
    const eventHash = computeEventHash(
      eventWithoutHash as Record<string, unknown>,
      prevHash
    );

    // 4. Build complete event
    const event: LedgerEvent = {
      ...eventWithoutHash,
      event_hash: eventHash,
    };

    // 5. REPO FIRST: Append to JSONL file
    ensureDirectory(filePath);
    fs.appendFileSync(filePath, JSON.stringify(event) + "\n");

    // 6. DB SECOND: Project to database
    try {
      const db = getDb();
      const projector = getProjector(event.event_schema_version);
      await projector(db, event);
    } catch (dbError) {
      // DB projection failed — repo write succeeded, so the event is safe.
      // Log the failure and add to retry queue.
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      console.error(
        `[writer] PROJECTION_UPDATE_FAILED for event ${eventHash}: ${errorMessage}`
      );

      addToRetryQueue(event, errorMessage);

      // Create incident issue (best-effort, don't fail the whole operation)
      try {
        await createIncidentIssue({
          type: "PROJECTION_UPDATE_FAILED",
          description: `Failed to project event to database. Event hash: ${eventHash}. The event has been written to the JSONL ledger and added to the retry queue.`,
          metadata: {
            event_hash: eventHash,
            event_type: eventType,
            tenant_id: tenantId,
            case_id: caseId,
            error: errorMessage,
          },
        });
      } catch (issueError) {
        console.error(
          "[writer] Failed to create incident issue:",
          issueError instanceof Error ? issueError.message : String(issueError)
        );
      }
    }

    // 7. Return the complete event
    return event;
  } finally {
    mutex.release();
  }
}

/**
 * Generate a new case ID using nanoid.
 */
export function generateCaseId(): string {
  return `case-${nanoid(12)}`;
}
