# artifacts/ — Human-Uploaded Documents

## What this directory contains
Documents uploaded by humans through the Web UI.
These are NOT system-generated — they are evidence artifacts provided by people.

## Directory Layout
- `governance/` — RACI narrative PDFs, policy documents
- `qms/` — Process map (SIPOC PDF), independence attestations
- `audit/` — Subservice review memos, quality risk assessments, signer attestations
- `cases/{tenantId}/{caseId}/` — Per-case uploaded documents (engagement letters, reports)

## Rules
- Files are uploaded via Web UI, never directly committed
- Upload handler computes SHA256 hash and records it in the ledger
- Accepted formats: PDF, DOCX, XLSX, PNG, JPG
- Max file size: configured in system settings
- File names: kebab-case, descriptive (e.g. `engagement-letter.pdf`)
- Tenant boundary applies to `cases/` subdirectory
