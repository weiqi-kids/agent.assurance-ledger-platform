# ledger/governance/ — Governance Records

## Contents
- `control-inventory.json` — 30 controls with 17 required fields each
- `control-framework-mapping.csv` — SOC1/ISQM1/ISO9001 mapping
- `role-matrix.json` — Role definitions
- `role-assignment-register.json` — Role → individual assignments
- `raci-matrix.json` — Controls × roles RACI grid

## Rules
- All files validated against schemas in `core/schemas/`
- Changes to control definitions require change-request Issue + dual approval
- `control_id` format: `{DOMAIN}-{NNN}` (e.g. AC-001, PI-003)
- Domains: AC (Access Control), CM (Change Management), PI (Processing Integrity), CF (Configuration), IR (Incident Response), MN (Monitoring)
