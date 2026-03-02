/**
 * Hash library for ledger integrity.
 *
 * - SHA-256 hashing
 * - RFC 8785 (JCS) JSON canonicalization
 * - Event hash computation (canonical event + prev_hash)
 * - Hash chain verification
 *
 * Framework-agnostic: no Next.js imports.
 */
import { createHash } from "crypto";

/**
 * Compute SHA-256 hash of a string or Buffer.
 * Returns "sha256:<hex>" prefixed string.
 */
export function computeSHA256(input: string | Buffer): string {
  const hash = createHash("sha256").update(input).digest("hex");
  return `sha256:${hash}`;
}

/**
 * RFC 8785 (JCS) JSON Canonicalization.
 *
 * Rules:
 * 1. Object keys sorted lexicographically (by UTF-16 code units)
 * 2. No insignificant whitespace
 * 3. Numbers: no leading zeros, no trailing zeros after decimal, no positive sign
 * 4. Strings: minimal escape sequences
 * 5. No duplicate keys
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    if (!isFinite(value)) {
      throw new Error("Cannot canonicalize Infinity or NaN");
    }
    // JSON.stringify handles number formatting per RFC 8785 for finite numbers
    return JSON.stringify(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return `[${items.join(",")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((key) => {
      const val = obj[key];
      if (val === undefined) return null;
      return `${JSON.stringify(key)}:${canonicalize(val)}`;
    }).filter((pair): pair is string => pair !== null);
    return `{${pairs.join(",")}}`;
  }

  throw new Error(`Cannot canonicalize type: ${typeof value}`);
}

/**
 * Compute event hash for a ledger event.
 *
 * hash = SHA256(canonicalize(event_without_hash) + prev_hash)
 *
 * The event object should NOT include event_hash (it will be stripped if present).
 */
export function computeEventHash(
  event: Record<string, unknown>,
  prevHash: string
): string {
  // Strip event_hash from the event before canonicalizing
  const { event_hash: _, ...eventWithoutHash } = event;
  const canonical = canonicalize(eventWithoutHash);
  const input = canonical + prevHash;
  return computeSHA256(input);
}

/** Genesis hash (first event in a chain) */
export const GENESIS_HASH =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Verify a hash chain from an array of events.
 *
 * Each event must have:
 * - event_hash: string
 * - prev_hash: string
 *
 * Returns { valid: true } or { valid: false, error: string, index: number }
 */
export function verifyHashChain(
  events: Array<Record<string, unknown>>
): { valid: true } | { valid: false; error: string; index: number } {
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventHash = event.event_hash as string;
    const prevHash = event.prev_hash as string;

    // Check prev_hash linkage
    if (prevHash !== expectedPrevHash) {
      return {
        valid: false,
        error: `Event ${i}: prev_hash mismatch. Expected "${expectedPrevHash}", got "${prevHash}"`,
        index: i,
      };
    }

    // Recompute hash and verify
    const computed = computeEventHash(event, prevHash);
    if (computed !== eventHash) {
      return {
        valid: false,
        error: `Event ${i}: hash mismatch. Expected "${computed}", got "${eventHash}"`,
        index: i,
      };
    }

    expectedPrevHash = eventHash;
  }

  return { valid: true };
}

/**
 * Compute SHA-256 hash of a file's contents (Buffer).
 */
export function computeFileHash(content: Buffer): string {
  return computeSHA256(content);
}
