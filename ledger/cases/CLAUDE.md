# ledger/cases/ — Case Event Ledger

## Path Convention
`ledger/cases/{tenantId}/{caseId}/events.jsonl`

Each tenant's cases are isolated in their own directory.

## Rules
- NEVER write to event files directly — use `writer.ts`
- Each line in events.jsonl is a JSON object with:
  - `event_type` (CASE_CREATED, STATUS_CHANGED, DOCUMENT_UPLOADED, etc.)
  - `timestamp` (ISO 8601)
  - `actor` (user ID)
  - `event_hash` (SHA256 of canonicalized event + prev_hash)
  - `prev_hash` (hash of previous event, "sha256:00000..." for first)
  - `event_schema_version` (semver)
  - `payload` (event-specific data)
- Hash chain must never be broken
- Tenant boundary: API middleware verifies tenant ownership before any access
