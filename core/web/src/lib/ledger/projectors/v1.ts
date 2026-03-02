/**
 * Projector v1 — projects ledger events into the database.
 *
 * This is the read-model side of event sourcing.
 * Events written to JSONL are projected here to make them queryable.
 */
import { caseLedgerEvents, cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { LedgerEvent } from "../types";

/**
 * Project a single ledger event to the database.
 *
 * - Always inserts into caseLedgerEvents.
 * - For STATUS_CHANGED events, updates the cases table status.
 * - For CASE_CREATED events, inserts a new case row.
 * - For ASSIGNMENT_CHANGED events, updates assignedTo.
 *
 * The `db` parameter accepts AppDatabase (union type), cast via `as any`
 * at the call site to avoid Drizzle union-type limitations.
 */
export async function projectEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  event: LedgerEvent
): Promise<void> {
  // For CASE_CREATED, insert the case row FIRST (caseLedgerEvents.caseId has FK to cases.id)
  if (event.event_type === "CASE_CREATED") {
    const payload = event.payload as {
      title: string;
      description?: string;
    };
    await db.insert(cases).values({
      id: event.case_id,
      tenantId: event.tenant_id,
      title: payload.title,
      description: payload.description ?? null,
      status: "draft",
      createdBy: event.actor,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    });
  }

  // Insert the event into the caseLedgerEvents table
  await db.insert(caseLedgerEvents).values({
    id: nanoid(),
    caseId: event.case_id,
    tenantId: event.tenant_id,
    eventType: event.event_type,
    timestamp: event.timestamp,
    actor: event.actor,
    eventHash: event.event_hash,
    prevHash: event.prev_hash,
    eventSchemaVersion: event.event_schema_version,
    payload: JSON.stringify(event.payload),
  });

  // Handle other event types
  switch (event.event_type) {
    case "CASE_CREATED":
      // Already handled above
      break;

    case "STATUS_CHANGED": {
      const payload = event.payload as { new_status: string };
      await db
        .update(cases)
        .set({
          status: payload.new_status,
          updatedAt: event.timestamp,
        })
        .where(eq(cases.id, event.case_id));
      break;
    }

    case "ASSIGNMENT_CHANGED": {
      const payload = event.payload as { assigned_to: string | null };
      await db
        .update(cases)
        .set({
          assignedTo: payload.assigned_to,
          updatedAt: event.timestamp,
        })
        .where(eq(cases.id, event.case_id));
      break;
    }

    default:
      // Other event types only need the caseLedgerEvents insert (already done above)
      break;
  }
}
