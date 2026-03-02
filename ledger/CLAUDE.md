# ledger/ — Event Store (Source of Truth)

## Critical: This is the immutable evidence repository

### What this directory contains
- Append-only JSONL event logs (hash-chained)
- System-maintained governance, QMS, and audit records
- All data here is the canonical source of truth

### Rules
- NEVER manually edit files in this directory
- NEVER delete or modify existing entries
- ALL writes must go through `core/web/lib/ledger/writer.ts`
- Every event includes `event_schema_version` and `event_hash`
- Hash chain: each event's hash includes the previous event's hash
- DB (Drizzle) is a projection of this data and can be rebuilt via replay

### Event Sourcing Write Order
1. Writer acquires mutex
2. Computes hash chain (prev_hash from last JSONL line)
3. Appends to JSONL file (Repo write FIRST)
4. Projects to DB (second, can retry on failure)
5. Releases mutex

### Directory Layout
- `governance/` — Control inventory, role matrix, RACI, framework mapping
- `qms/` — Risk register, document index, process map
- `audit/` — Findings log, evidence packs, sample selections, system releases
- `cases/{tenantId}/{caseId}/` — Per-case event ledger (tenant-isolated)
