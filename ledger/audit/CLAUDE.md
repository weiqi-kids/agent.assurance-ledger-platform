# ledger/audit/ — Audit Records

## Contents
- `findings-log.json` — All audit findings (synced from GitHub Issues)
- `complaint-log.json` — Client complaint register
- `evidence-packages/YYYY-QX/` — Quarterly evidence packs (deterministic)
- `sample-selection/YYYY-QX.csv` — Sample selections with metadata headers
- `system-releases/` — CI/CD evidence (GPG verification logs)
- `subservice-review-YYYY.md` — Annual subservice organization review
- `evidence-pack-config.json` — Exclusion rules for evidence packs

## Rules
- Sample selection CSVs must include header metadata: seed, population_query, operator, commit SHA, timestamp
- Evidence packs must be deterministic (same input = same hash)
- Findings sync bidirectionally with GitHub Issues
- All files validated against schemas
