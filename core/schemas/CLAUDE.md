# core/schemas/ — JSON Schema Version Governance

## Rules
- Every schema MUST include a `schema_version` field (semver, e.g. "1.0.0")
- Every schema MUST include `$id` pointing to its path
- Schema changes MUST go through a change-request Issue + dual approval PR
- Changes MUST be backward compatible (new fields = optional), or provide a migrator
- All changes recorded in `core/schemas/CHANGELOG.md`

## Naming
- Files: `{entity}.schema.json` (kebab-case)
- Example: `control-inventory.schema.json`

## Validation
- CI validates all `ledger/**/*.json` and `artifacts/**/*.json` against these schemas
- Web app validates at API layer before writing
- `schema_version` compatibility is checked during validation and replay
