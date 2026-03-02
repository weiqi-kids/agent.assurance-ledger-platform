CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider_type" text NOT NULL,
	"model" text NOT NULL,
	"api_endpoint" text,
	"enabled" integer DEFAULT 1 NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"control_id" text NOT NULL,
	"seed" integer NOT NULL,
	"population_query" text NOT NULL,
	"sample_size" integer NOT NULL,
	"operator" text NOT NULL,
	"program_version" text NOT NULL,
	"sampling_engine_version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_ledger_events" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" text NOT NULL,
	"actor" text NOT NULL,
	"event_hash" text NOT NULL,
	"prev_hash" text NOT NULL,
	"event_schema_version" text DEFAULT '1.0.0' NOT NULL,
	"payload" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"assigned_to" text,
	"created_by" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" text PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"github_issue_number" integer,
	"created_at" text DEFAULT now() NOT NULL,
	"resolved_at" text
);
--> statement-breakpoint
CREATE TABLE "controls" (
	"id" text PRIMARY KEY NOT NULL,
	"control_id" text NOT NULL,
	"domain" text NOT NULL,
	"control_statement" text NOT NULL,
	"purpose" text NOT NULL,
	"owner_role" text NOT NULL,
	"backup_owner_role" text NOT NULL,
	"frequency" text NOT NULL,
	"system_components" text NOT NULL,
	"evidence_types" text NOT NULL,
	"evidence_path_convention" text NOT NULL,
	"linked_risks" text NOT NULL,
	"risk_tier" text NOT NULL,
	"population_definition" text NOT NULL,
	"sample_unit" text NOT NULL,
	"failure_criteria" text NOT NULL,
	"last_reviewed_at" text,
	"approved_by" text,
	CONSTRAINT "controls_control_id_unique" UNIQUE("control_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"user_id" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_index" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"version" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"supersedes_document_id" text,
	"distribution_list_reference" text,
	"notification_evidence_path" text,
	"archival_location" text,
	"approved_by" text,
	"approved_at" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "document_index_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "evidence_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"generated_at" text NOT NULL,
	"generated_by" text NOT NULL,
	"artifact_count" integer NOT NULL,
	"pack_hash" text NOT NULL,
	"signed_by" text,
	"approval_timestamp" text,
	"status" text DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" text PRIMARY KEY NOT NULL,
	"finding_id" text NOT NULL,
	"control_id" text,
	"case_id" text,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"description" text NOT NULL,
	"detection_method" text NOT NULL,
	"control_effectiveness_impact" text NOT NULL,
	"auditor_notified" integer DEFAULT 0 NOT NULL,
	"management_response_text" text,
	"github_issue_number" integer,
	"created_at" text DEFAULT now() NOT NULL,
	"resolved_at" text,
	CONSTRAINT "findings_finding_id_unique" UNIQUE("finding_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"ai_provider_id" text,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_registers" (
	"id" text PRIMARY KEY NOT NULL,
	"risk_id" text NOT NULL,
	"description" text NOT NULL,
	"linked_controls" text NOT NULL,
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"risk_score" integer NOT NULL,
	"mitigation_strategy" text NOT NULL,
	"residual_risk_justification" text NOT NULL,
	"risk_acceptance_approval" text,
	"review_cycle" text NOT NULL,
	"kri_threshold" double precision,
	"kri_last_value" double precision,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "risk_registers_risk_id_unique" UNIQUE("risk_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" text NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" text,
	"image" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"tenant_id" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" text NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_samples" ADD CONSTRAINT "audit_samples_control_id_controls_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("control_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_ledger_events" ADD CONSTRAINT "case_ledger_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_packs" ADD CONSTRAINT "evidence_packs_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_packs" ADD CONSTRAINT "evidence_packs_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_control_id_controls_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("control_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;