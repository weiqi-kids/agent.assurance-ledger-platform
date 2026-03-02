/**
 * In-memory retry queue for failed DB projections.
 *
 * When a ledger event is written to JSONL (repo) but the DB projection fails,
 * the event is added to this queue. A background process can then retry
 * projecting the events to the database.
 */
import type { LedgerEvent } from "./types";
import { getProjector } from "./projectors/registry";
import { getDb } from "@/lib/db";

interface RetryEntry {
  event: LedgerEvent;
  failedAt: string;
  retryCount: number;
  lastError: string;
}

const retryQueue: RetryEntry[] = [];

/** Maximum number of retries before giving up on an entry */
const MAX_RETRIES = 5;

/**
 * Add a failed projection to the retry queue.
 */
export function addToRetryQueue(event: LedgerEvent, error: string): void {
  retryQueue.push({
    event,
    failedAt: new Date().toISOString(),
    retryCount: 0,
    lastError: error,
  });
}

/**
 * Process pending items in the retry queue.
 * Returns the number of successfully processed items.
 */
export async function processRetryQueue(): Promise<number> {
  let processed = 0;
  const remaining: RetryEntry[] = [];

  for (const entry of retryQueue) {
    if (entry.retryCount >= MAX_RETRIES) {
      // Keep in queue but skip processing — needs manual intervention
      remaining.push(entry);
      continue;
    }

    try {
      const db = getDb();
      const projector = getProjector(entry.event.event_schema_version);
      await projector(db, entry.event);
      processed++;
    } catch (err) {
      remaining.push({
        ...entry,
        retryCount: entry.retryCount + 1,
        lastError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Replace queue contents
  retryQueue.length = 0;
  retryQueue.push(...remaining);

  return processed;
}

/**
 * Get the current size of the retry queue.
 */
export function getRetryQueueSize(): number {
  return retryQueue.length;
}

/**
 * Get pending retry entries (for diagnostics).
 */
export function getRetryQueueEntries(): readonly RetryEntry[] {
  return retryQueue;
}
