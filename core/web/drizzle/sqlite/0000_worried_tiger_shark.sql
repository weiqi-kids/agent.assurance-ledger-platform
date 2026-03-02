CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider_type` text NOT NULL,
	`model` text NOT NULL,
	`api_endpoint` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_samples` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`control_id` text NOT NULL,
	`seed` integer NOT NULL,
	`population_query` text NOT NULL,
	`sample_size` integer NOT NULL,
	`operator` text NOT NULL,
	`program_version` text NOT NULL,
	`sampling_engine_version` text DEFAULT '1.0.0' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`control_id`) REFERENCES `controls`(`control_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `case_ledger_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`event_type` text NOT NULL,
	`timestamp` text NOT NULL,
	`actor` text NOT NULL,
	`event_hash` text NOT NULL,
	`prev_hash` text NOT NULL,
	`event_schema_version` text DEFAULT '1.0.0' NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`assigned_to` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` text PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`github_issue_number` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE TABLE `controls` (
	`id` text PRIMARY KEY NOT NULL,
	`control_id` text NOT NULL,
	`domain` text NOT NULL,
	`control_statement` text NOT NULL,
	`purpose` text NOT NULL,
	`owner_role` text NOT NULL,
	`backup_owner_role` text NOT NULL,
	`frequency` text NOT NULL,
	`system_components` text NOT NULL,
	`evidence_types` text NOT NULL,
	`evidence_path_convention` text NOT NULL,
	`linked_risks` text NOT NULL,
	`risk_tier` text NOT NULL,
	`population_definition` text NOT NULL,
	`sample_unit` text NOT NULL,
	`failure_criteria` text NOT NULL,
	`last_reviewed_at` text,
	`approved_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `controls_control_id_unique` ON `controls` (`control_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `document_index` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`title` text NOT NULL,
	`document_type` text NOT NULL,
	`version` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`supersedes_document_id` text,
	`distribution_list_reference` text,
	`notification_evidence_path` text,
	`archival_location` text,
	`approved_by` text,
	`approved_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_index_document_id_unique` ON `document_index` (`document_id`);--> statement-breakpoint
CREATE TABLE `evidence_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`generated_at` text NOT NULL,
	`generated_by` text NOT NULL,
	`artifact_count` integer NOT NULL,
	`pack_hash` text NOT NULL,
	`signed_by` text,
	`approval_timestamp` text,
	`status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`signed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`finding_id` text NOT NULL,
	`control_id` text,
	`case_id` text,
	`severity` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`description` text NOT NULL,
	`detection_method` text NOT NULL,
	`control_effectiveness_impact` text NOT NULL,
	`auditor_notified` integer DEFAULT 0 NOT NULL,
	`management_response_text` text,
	`github_issue_number` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`control_id`) REFERENCES `controls`(`control_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `findings_finding_id_unique` ON `findings` (`finding_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`ai_provider_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ai_provider_id`) REFERENCES `ai_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risk_registers` (
	`id` text PRIMARY KEY NOT NULL,
	`risk_id` text NOT NULL,
	`description` text NOT NULL,
	`linked_controls` text NOT NULL,
	`likelihood` integer NOT NULL,
	`impact` integer NOT NULL,
	`risk_score` integer NOT NULL,
	`mitigation_strategy` text NOT NULL,
	`residual_risk_justification` text NOT NULL,
	`risk_acceptance_approval` text,
	`review_cycle` text NOT NULL,
	`kri_threshold` real,
	`kri_last_value` real,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `risk_registers_risk_id_unique` ON `risk_registers` (`risk_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` text,
	`image` text,
	`role` text DEFAULT 'viewer' NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);