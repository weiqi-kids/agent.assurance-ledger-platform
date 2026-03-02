/**
 * Seed script: Populates the database with initial control inventory and system settings.
 *
 * Usage: DB_DRIVER=sqlite DATABASE_URL=file:./dev.db pnpm tsx src/lib/db/seed.ts
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import { controls, systemSettings } from "./schema";

const DB_PATH = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
  /^file:/,
  ""
);

const client = new Database(DB_PATH);
client.pragma("journal_mode = WAL");
const db = drizzle(client);

// ------------------------------------------------------------
// 30 Controls: 5 per domain (AC, CM, PI, CF, IR, MN)
// ------------------------------------------------------------

const controlData = [
  // === Access Control (AC) ===
  {
    controlId: "AC-001",
    domain: "AC",
    controlStatement:
      "User authentication is enforced via OAuth 2.0 (Google/LINE) for all platform access.",
    purpose: "Ensure only authenticated users access the platform.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["nextauth-middleware", "oauth-providers"]),
    evidenceTypes: JSON.stringify(["auth-logs", "session-records"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-001"]),
    riskTier: "High",
    populationDefinition: "All login attempts during the audit period",
    sampleUnit: "Individual login event",
    failureCriteria: "Login permitted without valid OAuth token",
  },
  {
    controlId: "AC-002",
    domain: "AC",
    controlStatement:
      "Role-based access control (RBAC) restricts platform functions to authorized roles.",
    purpose: "Prevent unauthorized access to sensitive operations.",
    ownerRole: "system-admin",
    backupOwnerRole: "tech-lead",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["role-guard-middleware", "role-matrix"]),
    evidenceTypes: JSON.stringify(["role-assignment-register", "access-denied-logs"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-001", "RISK-002"]),
    riskTier: "High",
    populationDefinition: "All role-restricted operations during the audit period",
    sampleUnit: "Individual restricted operation attempt",
    failureCriteria: "Operation executed by user without required role",
  },
  {
    controlId: "AC-003",
    domain: "AC",
    controlStatement:
      "Case approval actions are restricted to Engagement Partner and Quality Manager roles.",
    purpose: "Ensure only authorized personnel approve deliverables.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["case-approval-api", "role-guard"]),
    evidenceTypes: JSON.stringify(["approval-events", "ledger-entries"]),
    evidencePathConvention: "/cases/<CASE_ID>/",
    linkedRisks: JSON.stringify(["RISK-003"]),
    riskTier: "High",
    populationDefinition: "All approval events during the audit period",
    sampleUnit: "Individual approval event",
    failureCriteria: "Approval granted by unauthorized role",
  },
  {
    controlId: "AC-004",
    domain: "AC",
    controlStatement:
      "Evidence pack signing is restricted to the Quality Manager role.",
    purpose: "Ensure evidence integrity through controlled signing authority.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Quarterly",
    systemComponents: JSON.stringify(["evidence-pack-signer", "role-guard"]),
    evidenceTypes: JSON.stringify(["signer-attestation", "signed-manifest"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-003"]),
    riskTier: "High",
    populationDefinition: "All evidence pack signing events",
    sampleUnit: "Individual signing event",
    failureCriteria: "Evidence pack signed by non-QM role",
  },
  {
    controlId: "AC-005",
    domain: "AC",
    controlStatement:
      "Quarterly access reviews verify user roles and deactivate stale accounts.",
    purpose: "Maintain principle of least privilege over time.",
    ownerRole: "system-admin",
    backupOwnerRole: "quality-manager",
    frequency: "Quarterly",
    systemComponents: JSON.stringify(["user-management-ui", "access-review-report"]),
    evidenceTypes: JSON.stringify(["access-review-report", "deactivation-logs"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-002"]),
    riskTier: "Medium",
    populationDefinition: "All active user accounts at review date",
    sampleUnit: "Individual user account",
    failureCriteria: "Stale account not deactivated within 30 days of review",
  },

  // === Change Management (CM) ===
  {
    controlId: "CM-001",
    domain: "CM",
    controlStatement:
      "All code changes require a pull request with at least one reviewer approval before merge.",
    purpose: "Ensure code changes are reviewed for quality and security.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["github-branch-protection", "pr-review-workflow"]),
    evidenceTypes: JSON.stringify(["pr-merge-records", "review-approvals"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-004"]),
    riskTier: "High",
    populationDefinition: "All PRs merged to main during the audit period",
    sampleUnit: "Individual pull request",
    failureCriteria: "PR merged without required reviewer approval",
  },
  {
    controlId: "CM-002",
    domain: "CM",
    controlStatement:
      "All commits to main branch must have valid GPG signatures verified by CI.",
    purpose: "Ensure code provenance and prevent unauthorized modifications.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["gpg-verify-workflow", "branch-protection"]),
    evidenceTypes: JSON.stringify(["ci-gpg-verification-logs", "commit-signatures"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-004", "RISK-005"]),
    riskTier: "High",
    populationDefinition: "All commits to main during the audit period",
    sampleUnit: "Individual commit",
    failureCriteria: "Unsigned or invalidly signed commit on main",
  },
  {
    controlId: "CM-003",
    domain: "CM",
    controlStatement:
      "Schema changes require a change-request Issue and dual approval PR.",
    purpose: "Ensure data model changes are deliberate and backward compatible.",
    ownerRole: "tech-lead",
    backupOwnerRole: "quality-manager",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["github-issue-templates", "codeowners"]),
    evidenceTypes: JSON.stringify(["change-request-issues", "dual-approval-prs"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-006"]),
    riskTier: "Medium",
    populationDefinition: "All schema changes during the audit period",
    sampleUnit: "Individual schema change PR",
    failureCriteria: "Schema change merged without change-request Issue or dual approval",
  },
  {
    controlId: "CM-004",
    domain: "CM",
    controlStatement:
      "CI pipeline validates JSON schemas, runs lint, build, and tests before merge.",
    purpose: "Prevent defective code from reaching production.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["validate-workflow", "github-actions"]),
    evidenceTypes: JSON.stringify(["ci-pipeline-logs", "test-results"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-004"]),
    riskTier: "Medium",
    populationDefinition: "All PRs targeting main during the audit period",
    sampleUnit: "Individual CI pipeline run",
    failureCriteria: "PR merged with failed CI checks",
  },
  {
    controlId: "CM-005",
    domain: "CM",
    controlStatement:
      "Release tags are GPG-signed and CI evidence is archived in the ledger.",
    purpose: "Maintain auditable release history with provenance.",
    ownerRole: "tech-lead",
    backupOwnerRole: "quality-manager",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["release-workflow", "ledger-system-releases"]),
    evidenceTypes: JSON.stringify(["signed-tags", "release-ci-logs"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-005"]),
    riskTier: "Medium",
    populationDefinition: "All releases during the audit period",
    sampleUnit: "Individual release tag",
    failureCriteria: "Release tag unsigned or CI evidence missing from ledger",
  },

  // === Processing Integrity (PI) ===
  {
    controlId: "PI-001",
    domain: "PI",
    controlStatement:
      "All ledger events are hash-chained using SHA-256, ensuring tamper-evidence.",
    purpose: "Guarantee immutability and detect unauthorized ledger modifications.",
    ownerRole: "tech-lead",
    backupOwnerRole: "quality-manager",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["ledger-writer", "hash-library"]),
    evidenceTypes: JSON.stringify(["hash-chain-verification-logs", "ledger-events"]),
    evidencePathConvention: "/cases/<CASE_ID>/",
    linkedRisks: JSON.stringify(["RISK-007"]),
    riskTier: "High",
    populationDefinition: "All ledger events during the audit period",
    sampleUnit: "Individual ledger event",
    failureCriteria: "Event hash does not match recomputed hash from canonical form + prev_hash",
  },
  {
    controlId: "PI-002",
    domain: "PI",
    controlStatement:
      "Ledger writes follow single-writer pattern via mutex to prevent concurrent corruption.",
    purpose: "Ensure hash chain integrity under concurrent access.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["ledger-writer-mutex", "writer.ts"]),
    evidenceTypes: JSON.stringify(["writer-conflict-logs", "mutex-acquisition-logs"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-007"]),
    riskTier: "High",
    populationDefinition: "All concurrent write attempts during the audit period",
    sampleUnit: "Individual write operation",
    failureCriteria: "Concurrent write bypasses mutex, corrupting hash chain",
  },
  {
    controlId: "PI-003",
    domain: "PI",
    controlStatement:
      "Audit sampling uses fixed-seed PRNG with documented seed, operator, and commit SHA.",
    purpose: "Ensure sampling reproducibility and prevent post-hoc cherry-picking.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Quarterly",
    systemComponents: JSON.stringify(["sampling-engine", "sample-selection-csv"]),
    evidenceTypes: JSON.stringify(["sample-selection-csv", "seed-documentation"]),
    evidencePathConvention: "/audit/sample-selection/",
    linkedRisks: JSON.stringify(["RISK-008"]),
    riskTier: "High",
    populationDefinition: "All sampling events during the audit period",
    sampleUnit: "Individual sampling execution",
    failureCriteria: "Same seed + population produces different sample selection",
  },
  {
    controlId: "PI-004",
    domain: "PI",
    controlStatement:
      "Evidence packs are generated deterministically: same input produces same ZIP hash.",
    purpose: "Ensure evidence pack integrity and reproducibility.",
    ownerRole: "quality-manager",
    backupOwnerRole: "tech-lead",
    frequency: "Quarterly",
    systemComponents: JSON.stringify(["evidence-pack-generator", "deterministic-zip"]),
    evidenceTypes: JSON.stringify(["evidence-pack-manifest", "pack-hash-comparison"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-008"]),
    riskTier: "High",
    populationDefinition: "All evidence packs generated during the audit period",
    sampleUnit: "Individual evidence pack",
    failureCriteria: "Regenerating pack from same inputs produces different hash",
  },
  {
    controlId: "PI-005",
    domain: "PI",
    controlStatement:
      "Event canonicalization follows RFC 8785 (JCS) for consistent hash computation.",
    purpose: "Prevent hash inconsistencies from JSON serialization differences.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["canonicalize-library", "hash-library"]),
    evidenceTypes: JSON.stringify(["canonicalization-test-results"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-007"]),
    riskTier: "Medium",
    populationDefinition: "All canonicalized events during the audit period",
    sampleUnit: "Individual event canonicalization",
    failureCriteria: "Canonicalized output differs from RFC 8785 reference",
  },

  // === Configuration (CF) ===
  {
    controlId: "CF-001",
    domain: "CF",
    controlStatement:
      "Application configuration is managed via environment variables with .env.example documentation.",
    purpose: "Ensure consistent and documented configuration across environments.",
    ownerRole: "system-admin",
    backupOwnerRole: "tech-lead",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["env-config", "dotenv-example"]),
    evidenceTypes: JSON.stringify(["env-example-file", "config-diff"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-009"]),
    riskTier: "Medium",
    populationDefinition: "All config changes during the audit period",
    sampleUnit: "Individual configuration change",
    failureCriteria: "Configuration deployed without corresponding .env.example update",
  },
  {
    controlId: "CF-002",
    domain: "CF",
    controlStatement:
      "Database migrations are version-controlled and applied via Drizzle Kit.",
    purpose: "Ensure database schema changes are traceable and reversible.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["drizzle-kit", "migration-files"]),
    evidenceTypes: JSON.stringify(["migration-sql-files", "migration-logs"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-006"]),
    riskTier: "Medium",
    populationDefinition: "All database migrations during the audit period",
    sampleUnit: "Individual migration",
    failureCriteria: "Database schema change applied without version-controlled migration",
  },
  {
    controlId: "CF-003",
    domain: "CF",
    controlStatement:
      "PM2 process configuration is version-controlled in ecosystem.config.js.",
    purpose: "Ensure production process configuration is auditable.",
    ownerRole: "system-admin",
    backupOwnerRole: "tech-lead",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["pm2-ecosystem-config", "process-manager"]),
    evidenceTypes: JSON.stringify(["ecosystem-config-diff", "pm2-status-logs"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-009"]),
    riskTier: "Low",
    populationDefinition: "All PM2 config changes during the audit period",
    sampleUnit: "Individual config change",
    failureCriteria: "PM2 config change not reflected in version-controlled file",
  },
  {
    controlId: "CF-004",
    domain: "CF",
    controlStatement:
      "Nginx Proxy Manager SSL certificates are auto-renewed via Let's Encrypt.",
    purpose: "Ensure HTTPS is always available with valid certificates.",
    ownerRole: "system-admin",
    backupOwnerRole: "tech-lead",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["nginx-proxy-manager", "lets-encrypt"]),
    evidenceTypes: JSON.stringify(["ssl-certificate-logs", "renewal-records"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-010"]),
    riskTier: "Medium",
    populationDefinition: "All SSL certificate states during the audit period",
    sampleUnit: "Individual certificate check",
    failureCriteria: "Certificate expired or HTTPS unavailable",
  },
  {
    controlId: "CF-005",
    domain: "CF",
    controlStatement:
      "Dependency lock file (pnpm-lock.yaml) is committed and validated in CI.",
    purpose: "Ensure reproducible builds and prevent supply chain attacks.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Per Change",
    systemComponents: JSON.stringify(["pnpm-lock", "ci-install-check"]),
    evidenceTypes: JSON.stringify(["lockfile-diff", "ci-install-logs"]),
    evidencePathConvention: "/audit/system-releases/",
    linkedRisks: JSON.stringify(["RISK-011"]),
    riskTier: "Medium",
    populationDefinition: "All dependency changes during the audit period",
    sampleUnit: "Individual dependency update",
    failureCriteria: "Dependencies installed without lockfile validation",
  },

  // === Incident Response (IR) ===
  {
    controlId: "IR-001",
    domain: "IR",
    controlStatement:
      "Ledger write conflicts automatically generate LEDGER_WRITE_CONFLICT incident Issues.",
    purpose: "Ensure concurrent access issues are detected and tracked.",
    ownerRole: "tech-lead",
    backupOwnerRole: "quality-manager",
    frequency: "Event-driven",
    systemComponents: JSON.stringify(["writer-conflict-handler", "github-issues"]),
    evidenceTypes: JSON.stringify(["conflict-issues", "writer-logs"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-007"]),
    riskTier: "High",
    populationDefinition: "All LEDGER_WRITE_CONFLICT events during the audit period",
    sampleUnit: "Individual conflict event",
    failureCriteria: "Write conflict occurs without corresponding incident Issue",
  },
  {
    controlId: "IR-002",
    domain: "IR",
    controlStatement:
      "DB projection failures generate PROJECTION_UPDATE_FAILED incidents and enter retry queue.",
    purpose: "Ensure DB consistency is maintained or tracked when projection fails.",
    ownerRole: "tech-lead",
    backupOwnerRole: "system-admin",
    frequency: "Event-driven",
    systemComponents: JSON.stringify(["projection-retry-queue", "incident-handler"]),
    evidenceTypes: JSON.stringify(["projection-failure-logs", "retry-queue-records"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-012"]),
    riskTier: "High",
    populationDefinition: "All PROJECTION_UPDATE_FAILED events during the audit period",
    sampleUnit: "Individual projection failure",
    failureCriteria: "Projection failure not logged or not entered into retry queue",
  },
  {
    controlId: "IR-003",
    domain: "IR",
    controlStatement:
      "P1 security incidents are reported within 24 hours and tracked to resolution.",
    purpose: "Ensure timely response to critical security events.",
    ownerRole: "system-admin",
    backupOwnerRole: "tech-lead",
    frequency: "Event-driven",
    systemComponents: JSON.stringify(["incident-issue-template", "notification-system"]),
    evidenceTypes: JSON.stringify(["incident-issues", "response-timeline"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-013"]),
    riskTier: "High",
    populationDefinition: "All P1 incidents during the audit period",
    sampleUnit: "Individual P1 incident",
    failureCriteria: "P1 incident not reported within 24 hours",
  },
  {
    controlId: "IR-004",
    domain: "IR",
    controlStatement:
      "All findings from incident post-mortems are entered into the findings log.",
    purpose: "Ensure incidents drive continuous improvement.",
    ownerRole: "quality-manager",
    backupOwnerRole: "tech-lead",
    frequency: "Event-driven",
    systemComponents: JSON.stringify(["findings-log", "github-issues"]),
    evidenceTypes: JSON.stringify(["post-mortem-findings", "findings-log-entries"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-013"]),
    riskTier: "Medium",
    populationDefinition: "All resolved incidents during the audit period",
    sampleUnit: "Individual incident post-mortem",
    failureCriteria: "Incident resolved without findings log entry",
  },
  {
    controlId: "IR-005",
    domain: "IR",
    controlStatement:
      "Client complaints are recorded in the complaint register and tracked via GitHub Issues.",
    purpose: "Ensure client feedback is captured and addressed systematically.",
    ownerRole: "engagement-partner",
    backupOwnerRole: "quality-manager",
    frequency: "Event-driven",
    systemComponents: JSON.stringify(["complaint-register", "complaint-issue-template"]),
    evidenceTypes: JSON.stringify(["complaint-log-entries", "complaint-issues"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-014"]),
    riskTier: "Medium",
    populationDefinition: "All client complaints during the audit period",
    sampleUnit: "Individual complaint",
    failureCriteria: "Complaint not logged or not tracked to resolution",
  },

  // === Monitoring (MN) ===
  {
    controlId: "MN-001",
    domain: "MN",
    controlStatement:
      "Daily automated hash chain verification checks DB vs ledger JSONL consistency.",
    purpose: "Detect unauthorized modifications to ledger or database.",
    ownerRole: "tech-lead",
    backupOwnerRole: "quality-manager",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["hash-verification-workflow", "verify-chains-script"]),
    evidenceTypes: JSON.stringify(["verification-logs", "workflow-run-records"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-007"]),
    riskTier: "High",
    populationDefinition: "All daily verification runs during the audit period",
    sampleUnit: "Individual verification run",
    failureCriteria: "Verification not run for > 24 hours or inconsistency not flagged",
  },
  {
    controlId: "MN-002",
    domain: "MN",
    controlStatement:
      "KRI thresholds are monitored and breaches trigger alerts via the dashboard.",
    purpose: "Proactive risk management through key risk indicator monitoring.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["dashboard-kri", "risk-register"]),
    evidenceTypes: JSON.stringify(["kri-trend-reports", "breach-notifications"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-015"]),
    riskTier: "Medium",
    populationDefinition: "All KRI values during the audit period",
    sampleUnit: "Individual KRI measurement",
    failureCriteria: "KRI breach not detected or not alerted within threshold period",
  },
  {
    controlId: "MN-003",
    domain: "MN",
    controlStatement:
      "Quarterly management review evaluates findings, risks, and improvement actions.",
    purpose: "Ensure leadership oversight and continuous improvement.",
    ownerRole: "engagement-partner",
    backupOwnerRole: "quality-manager",
    frequency: "Quarterly",
    systemComponents: JSON.stringify(["dashboard-summary", "findings-log"]),
    evidenceTypes: JSON.stringify(["management-review-minutes", "action-items"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-015"]),
    riskTier: "Medium",
    populationDefinition: "All quarters during the audit period",
    sampleUnit: "Individual quarterly review",
    failureCriteria: "Quarter without documented management review",
  },
  {
    controlId: "MN-004",
    domain: "MN",
    controlStatement:
      "Document index tracks all policies, SOPs, and work instructions with version history.",
    purpose: "Ensure document governance and prevent use of obsolete procedures.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Continuous",
    systemComponents: JSON.stringify(["document-index", "qms-ui"]),
    evidenceTypes: JSON.stringify(["document-index-snapshot", "version-history"]),
    evidencePathConvention: "/audit/evidence-packages/YYYY-QX/",
    linkedRisks: JSON.stringify(["RISK-016"]),
    riskTier: "Low",
    populationDefinition: "All documents in the index during the audit period",
    sampleUnit: "Individual document",
    failureCriteria: "Active document missing from index or version not current",
  },
  {
    controlId: "MN-005",
    domain: "MN",
    controlStatement:
      "Annual subservice organization review obtains and evaluates GitHub's SOC report.",
    purpose: "Maintain oversight of subservice provider (GitHub) per carve-out method.",
    ownerRole: "quality-manager",
    backupOwnerRole: "engagement-partner",
    frequency: "Annual",
    systemComponents: JSON.stringify(["subservice-review-workflow", "review-memo"]),
    evidenceTypes: JSON.stringify(["subservice-review-memo", "github-soc-report"]),
    evidencePathConvention: "/audit/",
    linkedRisks: JSON.stringify(["RISK-017"]),
    riskTier: "Medium",
    populationDefinition: "Annual review cycle",
    sampleUnit: "Annual review",
    failureCriteria: "Review not completed within 90 days of SOC report availability",
  },
];

// ------------------------------------------------------------
// System Settings (projector version, audit period, etc.)
// ------------------------------------------------------------

const settingsData = [
  { key: "projector_version", value: "1.0.0" },
  { key: "audit_period_start", value: "2025-01-01" },
  { key: "audit_period_end", value: "2025-12-31" },
  { key: "sampling_engine_version", value: "1.0.0" },
  { key: "event_schema_version", value: "1.0.0" },
];

async function seed() {
  console.log("Seeding database...");

  // Insert controls
  for (const c of controlData) {
    db.insert(controls)
      .values({
        id: nanoid(),
        ...c,
      })
      .run();
  }
  console.log(`  Inserted ${controlData.length} controls.`);

  // Insert system settings
  for (const s of settingsData) {
    db.insert(systemSettings)
      .values({
        id: nanoid(),
        ...s,
      })
      .run();
  }
  console.log(`  Inserted ${settingsData.length} system settings.`);

  console.log("Seed complete.");
}

seed().catch(console.error);
