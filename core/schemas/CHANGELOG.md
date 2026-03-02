# JSON Schema Changelog

All notable changes to the JSON Schema definitions are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Schema versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-02

### Added
- `control-inventory.schema.json` — 30-control inventory with 17 required fields per control (control_id, domain, control_statement, purpose, owner_role, backup_owner_role, frequency, system_components, evidence_types, evidence_path_convention, linked_risks, risk_tier, population_definition, sample_unit, failure_criteria, last_reviewed_at, approved_by). Domain enum: AC, CM, PI, CF, IR, MN. Risk tier: High, Medium, Low. Frequency: Continuous, Per Change, Quarterly, Annual, Event-driven.
- `control-framework-mapping.schema.json` — Maps each control to SOC1 Type II objectives, ISQM1 paragraphs, and ISO 9001 clauses with explanation references.
- `evidence-pack-manifest.schema.json` — Deterministic evidence pack manifest with period, artifact list, SHA-256 artifact hashes, pack hash, signing, and approval timestamp.
- `findings-log.schema.json` — Audit findings with severity classification (Control Deficiency, Significant, Material), detection method, control effectiveness impact, and management response.
- `risk-register.schema.json` — Risk register with likelihood/impact scoring (1-5), linked controls, mitigation strategy, residual risk justification, review cycle, and KRI thresholds.
- `document-index.schema.json` — QMS document index tracking policies, SOPs, work instructions, and forms through their version lifecycle with distribution and archival.
- `role-matrix.schema.json` — Role definitions with permissions (CRUD + approve + export) per resource.
- `raci-matrix.schema.json` — Control-to-role RACI assignments (R/A/C/I/-) as a matrix structure.
- `complaint-log.schema.json` — Client complaint tracking from receipt through resolution (ISQM1/ISO 9001 requirement).
- `case-ledger-event.schema.json` — Append-only event sourcing schema with hash chaining (event_hash, prev_hash), 21 event types, and flexible payload.
- `process-map.schema.json` — QMS process map with core processes, support processes, process interactions, and KPIs.
- `sample-selection.schema.json` — Reproducible audit sampling records with seed, population query, operator, engine version, and commit SHA for auditability.
