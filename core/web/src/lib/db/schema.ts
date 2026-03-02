import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// ============================================================
// Schema Notes:
// - Uses SQLite core types as the canonical definition
// - text() for strings, timestamps (ISO 8601), JSON, UUIDs
// - integer() for numbers, booleans (0/1), foreign key refs
// - Timestamps stored as ISO 8601 text (portable across SQLite/PG)
// - IDs use text (nanoid/uuid generated in application code)
// - For PostgreSQL: same schema used at runtime via adapter layer
// ============================================================

// ------------------------------------------------------------
// Auth Tables (NextAuth.js compatible)
// ------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role").notNull().default("viewer"),
  tenantId: text("tenant_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// ------------------------------------------------------------
// Domain Tables
// ------------------------------------------------------------

export const aiProviders = sqliteTable("ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull(), // anthropic, openai, google
  model: text("model").notNull(),
  apiEndpoint: text("api_endpoint"),
  enabled: integer("enabled").notNull().default(1),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  aiProviderId: text("ai_provider_id").references(() => aiProviders.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, review, delivered, archived
  assignedTo: text("assigned_to").references(() => users.id),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const caseLedgerEvents = sqliteTable("case_ledger_events", {
  id: text("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  tenantId: text("tenant_id").notNull(),
  eventType: text("event_type").notNull(),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  eventHash: text("event_hash").notNull(),
  prevHash: text("prev_hash").notNull(),
  eventSchemaVersion: text("event_schema_version").notNull().default("1.0.0"),
  payload: text("payload").notNull(), // JSON string
});

export const controls = sqliteTable("controls", {
  id: text("id").primaryKey(),
  controlId: text("control_id").notNull().unique(), // e.g. AC-001
  domain: text("domain").notNull(), // AC, CM, PI, CF, IR, MN
  controlStatement: text("control_statement").notNull(),
  purpose: text("purpose").notNull(),
  ownerRole: text("owner_role").notNull(),
  backupOwnerRole: text("backup_owner_role").notNull(),
  frequency: text("frequency").notNull(), // Continuous, Per Change, Quarterly, Annual, Event-driven
  systemComponents: text("system_components").notNull(), // JSON array
  evidenceTypes: text("evidence_types").notNull(), // JSON array
  evidencePathConvention: text("evidence_path_convention").notNull(),
  linkedRisks: text("linked_risks").notNull(), // JSON array of risk_id
  riskTier: text("risk_tier").notNull(), // High, Medium, Low
  populationDefinition: text("population_definition").notNull(),
  sampleUnit: text("sample_unit").notNull(),
  failureCriteria: text("failure_criteria").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
  approvedBy: text("approved_by"),
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  findingId: text("finding_id").notNull().unique(), // human-readable ID
  controlId: text("control_id").references(() => controls.controlId),
  caseId: text("case_id").references(() => cases.id),
  severity: text("severity").notNull(), // Control Deficiency, Significant, Material
  status: text("status").notNull().default("open"), // open, remediation, closed
  description: text("description").notNull(),
  detectionMethod: text("detection_method").notNull(),
  controlEffectivenessImpact: text("control_effectiveness_impact").notNull(),
  auditorNotified: integer("auditor_notified").notNull().default(0),
  managementResponseText: text("management_response_text"),
  githubIssueNumber: integer("github_issue_number"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  resolvedAt: text("resolved_at"),
});

export const evidencePacks = sqliteTable("evidence_packs", {
  id: text("id").primaryKey(),
  period: text("period").notNull(), // e.g. 2025-Q1
  generatedAt: text("generated_at").notNull(),
  generatedBy: text("generated_by")
    .notNull()
    .references(() => users.id),
  artifactCount: integer("artifact_count").notNull(),
  packHash: text("pack_hash").notNull(),
  signedBy: text("signed_by").references(() => users.id),
  approvalTimestamp: text("approval_timestamp"),
  status: text("status").notNull().default("draft"), // draft, signed, archived
});

export const riskRegisters = sqliteTable("risk_registers", {
  id: text("id").primaryKey(),
  riskId: text("risk_id").notNull().unique(), // e.g. RISK-001
  description: text("description").notNull(),
  linkedControls: text("linked_controls").notNull(), // JSON array of control_id
  likelihood: integer("likelihood").notNull(), // 1-5
  impact: integer("impact").notNull(), // 1-5
  riskScore: integer("risk_score").notNull(), // likelihood * impact
  mitigationStrategy: text("mitigation_strategy").notNull(),
  residualRiskJustification: text("residual_risk_justification").notNull(),
  riskAcceptanceApproval: text("risk_acceptance_approval"),
  reviewCycle: text("review_cycle").notNull(), // Quarterly, Annual
  kriThreshold: real("kri_threshold"),
  kriLastValue: real("kri_last_value"),
  status: text("status").notNull().default("active"), // active, mitigated, accepted, closed
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const auditSamples = sqliteTable("audit_samples", {
  id: text("id").primaryKey(),
  period: text("period").notNull(), // e.g. 2025-Q1
  controlId: text("control_id")
    .notNull()
    .references(() => controls.controlId),
  seed: integer("seed").notNull(),
  populationQuery: text("population_query").notNull(),
  sampleSize: integer("sample_size").notNull(),
  operator: text("operator").notNull(),
  programVersion: text("program_version").notNull(), // git commit SHA
  samplingEngineVersion: text("sampling_engine_version").notNull().default("1.0.0"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const complaints = sqliteTable("complaints", {
  id: text("id").primaryKey(),
  clientName: text("client_name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  resolution: text("resolution"),
  githubIssueNumber: integer("github_issue_number"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  resolvedAt: text("resolved_at"),
});

export const documentIndex = sqliteTable("document_index", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(), // Policy, SOP, Work Instruction, Form
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"), // draft, approved, superseded, archived
  supersedesDocumentId: text("supersedes_document_id"),
  distributionListReference: text("distribution_list_reference"),
  notificationEvidencePath: text("notification_evidence_path"),
  archivalLocation: text("archival_location"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedBy: text("updated_by"),
});

// ------------------------------------------------------------
// Relations
// ------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  conversations: many(conversations),
  createdCases: many(cases),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  aiProvider: one(aiProviders, {
    fields: [messages.aiProviderId],
    references: [aiProviders.id],
  }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  assignee: one(users, { fields: [cases.assignedTo], references: [users.id] }),
  creator: one(users, { fields: [cases.createdBy], references: [users.id] }),
  ledgerEvents: many(caseLedgerEvents),
  findings: many(findings),
}));

export const caseLedgerEventsRelations = relations(caseLedgerEvents, ({ one }) => ({
  case: one(cases, {
    fields: [caseLedgerEvents.caseId],
    references: [cases.id],
  }),
}));

export const controlsRelations = relations(controls, ({ many }) => ({
  findings: many(findings),
  auditSamples: many(auditSamples),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  control: one(controls, {
    fields: [findings.controlId],
    references: [controls.controlId],
  }),
  case: one(cases, { fields: [findings.caseId], references: [cases.id] }),
}));

export const auditSamplesRelations = relations(auditSamples, ({ one }) => ({
  control: one(controls, {
    fields: [auditSamples.controlId],
    references: [controls.controlId],
  }),
}));

export const evidencePacksRelations = relations(evidencePacks, ({ one }) => ({
  generator: one(users, {
    fields: [evidencePacks.generatedBy],
    references: [users.id],
  }),
  signer: one(users, {
    fields: [evidencePacks.signedBy],
    references: [users.id],
  }),
}));
