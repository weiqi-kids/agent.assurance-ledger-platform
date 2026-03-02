/**
 * Ledger verification and replay engine.
 *
 * Provides tools for:
 * - Hash chain verification (against JSONL files)
 * - DB consistency checks (JSONL vs DB projection)
 * - Full replay from JSONL to rebuild DB projections
 */
import * as fs from "fs";
import * as path from "path";
import { verifyHashChain, GENESIS_HASH } from "./hash";
import { getProjector } from "./projectors/registry";
import { getDb } from "@/lib/db";
import { caseLedgerEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  LedgerEvent,
  VerificationResult,
  ConsistencyResult,
  ReplayResult,
} from "./types";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

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
 * Read all events from a JSONL file.
 */
function readEventsFromFile(filePath: string): LedgerEvent[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8").trimEnd();
  if (!content) {
    return [];
  }

  return content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as LedgerEvent);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify the hash chain integrity for a case's ledger events.
 *
 * Reads the JSONL file and verifies:
 * 1. Each event's prev_hash matches the previous event's event_hash
 * 2. Each event's event_hash is correctly computed
 * 3. The chain starts from GENESIS_HASH
 */
export async function verifyChain(
  tenantId: string,
  caseId: string
): Promise<VerificationResult> {
  const filePath = getEventsFilePath(tenantId, caseId);
  const events = readEventsFromFile(filePath);

  if (events.length === 0) {
    return {
      valid: true,
      eventCount: 0,
    };
  }

  // Verify the first event starts from GENESIS_HASH
  if (events[0].prev_hash !== GENESIS_HASH) {
    return {
      valid: false,
      eventCount: events.length,
      error: `First event does not start from GENESIS_HASH. Got "${events[0].prev_hash}"`,
      brokenAtIndex: 0,
    };
  }

  const result = verifyHashChain(
    events as unknown as Array<Record<string, unknown>>
  );

  if (result.valid) {
    return {
      valid: true,
      eventCount: events.length,
    };
  }

  return {
    valid: false,
    eventCount: events.length,
    error: result.error,
    brokenAtIndex: result.index,
  };
}

/**
 * Verify consistency between the JSONL ledger and the database projection.
 *
 * Checks:
 * 1. Event counts match
 * 2. All JSONL events exist in DB (by event_hash)
 * 3. No extra events in DB that are not in JSONL
 */
export async function verifyDbConsistency(
  tenantId: string,
  caseId: string
): Promise<ConsistencyResult> {
  const filePath = getEventsFilePath(tenantId, caseId);
  const ledgerEvents = readEventsFromFile(filePath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;
  const dbEvents: Array<{ eventHash: string }> = await db
    .select()
    .from(caseLedgerEvents)
    .where(
      and(
        eq(caseLedgerEvents.caseId, caseId),
        eq(caseLedgerEvents.tenantId, tenantId)
      )
    );

  const ledgerHashes = new Set(ledgerEvents.map((e) => e.event_hash));
  const dbHashes = new Set(dbEvents.map((e) => e.eventHash));

  const missingInDb = ledgerEvents
    .filter((e) => !dbHashes.has(e.event_hash))
    .map((e) => e.event_hash);

  const extraInDb = dbEvents
    .filter((e) => !ledgerHashes.has(e.eventHash))
    .map((e) => e.eventHash);

  return {
    consistent: missingInDb.length === 0 && extraInDb.length === 0,
    ledgerEventCount: ledgerEvents.length,
    dbEventCount: dbEvents.length,
    missingInDb,
    extraInDb,
  };
}

/**
 * Replay all events from the JSONL ledger to rebuild the DB projection.
 *
 * WARNING: This will re-project all events. Existing DB rows for this case
 * should be deleted before calling this function to avoid duplicates.
 */
export async function replayFromLedger(
  tenantId: string,
  caseId: string
): Promise<ReplayResult> {
  const filePath = getEventsFilePath(tenantId, caseId);
  const events = readEventsFromFile(filePath);
  const errors: string[] = [];
  let eventsReplayed = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;

  // Delete existing DB projections for this case
  await db
    .delete(caseLedgerEvents)
    .where(
      and(
        eq(caseLedgerEvents.caseId, caseId),
        eq(caseLedgerEvents.tenantId, tenantId)
      )
    );

  for (const event of events) {
    try {
      const projector = getProjector(event.event_schema_version);
      await projector(db, event);
      eventsReplayed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(
        `Event ${event.event_hash} (${event.event_type}): ${message}`
      );
    }
  }

  return {
    success: errors.length === 0,
    eventsReplayed,
    errors,
  };
}
