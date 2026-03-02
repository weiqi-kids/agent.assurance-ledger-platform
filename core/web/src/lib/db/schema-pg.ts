import { pgTable, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// ============================================================
// PostgreSQL Schema — mirrors schema.ts (SQLite) structure exactly.
// Column names, table names, and relations are identical.
// Only column type constructors differ.
// ============================================================

// ------------------------------------------------------------
// Auth Tables (NextAuth.js compatible)
// ------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: text("role").notNull().default("viewer"),
  tenantId: text("tenant_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const accounts = pgTable("accounts", {
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

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ------------------------------------------------------------
// Domain Tables
// ------------------------------------------------------------

export const aiProviders = pgTable("ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull(),
  model: text("model").notNull(),
  apiEndpoint: text("api_endpoint"),
  enabled: integer("enabled").notNull().default(1),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  aiProviderId: text("ai_provider_id").references(() => aiProviders.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  assignedTo: text("assigned_to").references(() => users.id),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const caseLedgerEvents = pgTable("case_ledger_events", {
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
  payload: text("payload").notNull(),
});

export const controls = pgTable("controls", {
  id: text("id").primaryKey(),
  controlId: text("control_id").notNull().unique(),
  domain: text("domain").notNull(),
  controlStatement: text("control_statement").notNull(),
  purpose: text("purpose").notNull(),
  ownerRole: text("owner_role").notNull(),
  backupOwnerRole: text("backup_owner_role").notNull(),
  frequency: text("frequency").notNull(),
  systemComponents: text("system_components").notNull(),
  evidenceTypes: text("evidence_types").notNull(),
  evidencePathConvention: text("evidence_path_convention").notNull(),
  linkedRisks: text("linked_risks").notNull(),
  riskTier: text("risk_tier").notNull(),
  populationDefinition: text("population_definition").notNull(),
  sampleUnit: text("sample_unit").notNull(),
  failureCriteria: text("failure_criteria").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
  approvedBy: text("approved_by"),
});

export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  findingId: text("finding_id").notNull().unique(),
  controlId: text("control_id").references(() => controls.controlId),
  caseId: text("case_id").references(() => cases.id),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  description: text("description").notNull(),
  detectionMethod: text("detection_method").notNull(),
  controlEffectivenessImpact: text("control_effectiveness_impact").notNull(),
  auditorNotified: integer("auditor_notified").notNull().default(0),
  managementResponseText: text("management_response_text"),
  githubIssueNumber: integer("github_issue_number"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  resolvedAt: text("resolved_at"),
});

export const evidencePacks = pgTable("evidence_packs", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  generatedAt: text("generated_at").notNull(),
  generatedBy: text("generated_by")
    .notNull()
    .references(() => users.id),
  artifactCount: integer("artifact_count").notNull(),
  packHash: text("pack_hash").notNull(),
  signedBy: text("signed_by").references(() => users.id),
  approvalTimestamp: text("approval_timestamp"),
  status: text("status").notNull().default("draft"),
});

export const riskRegisters = pgTable("risk_registers", {
  id: text("id").primaryKey(),
  riskId: text("risk_id").notNull().unique(),
  description: text("description").notNull(),
  linkedControls: text("linked_controls").notNull(),
  likelihood: integer("likelihood").notNull(),
  impact: integer("impact").notNull(),
  riskScore: integer("risk_score").notNull(),
  mitigationStrategy: text("mitigation_strategy").notNull(),
  residualRiskJustification: text("residual_risk_justification").notNull(),
  riskAcceptanceApproval: text("risk_acceptance_approval"),
  reviewCycle: text("review_cycle").notNull(),
  kriThreshold: doublePrecision("kri_threshold"),
  kriLastValue: doublePrecision("kri_last_value"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const auditSamples = pgTable("audit_samples", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  controlId: text("control_id")
    .notNull()
    .references(() => controls.controlId),
  seed: integer("seed").notNull(),
  populationQuery: text("population_query").notNull(),
  sampleSize: integer("sample_size").notNull(),
  operator: text("operator").notNull(),
  programVersion: text("program_version").notNull(),
  samplingEngineVersion: text("sampling_engine_version").notNull().default("1.0.0"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const complaints = pgTable("complaints", {
  id: text("id").primaryKey(),
  clientName: text("client_name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  githubIssueNumber: integer("github_issue_number"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  resolvedAt: text("resolved_at"),
});

export const documentIndex = pgTable("document_index", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"),
  supersedesDocumentId: text("supersedes_document_id"),
  distributionListReference: text("distribution_list_reference"),
  notificationEvidencePath: text("notification_evidence_path"),
  archivalLocation: text("archival_location"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
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
