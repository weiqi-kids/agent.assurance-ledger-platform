# Assurance Ledger Platform — Maintenance Reference

> **Status: Maintenance Mode** (Phase 0-9 complete)
> SOC1 Type II / ISQM1 / ISO9001 三框架審計就緒平台。
> GitHub repo 為不可變證據庫，Next.js Web UI 供客戶操作。
> Master Pack: `prompt/typeII-master-pack/v1.md`

---

## 1. Architecture Principles

### 1.1 Event Sourcing — Repo First, DB Second

`ledger/` = Event Store (append-only JSONL, source of truth)
DB (Drizzle) = Projection (read model, rebuildable from JSONL)

**Write flow (8 steps in `core/web/src/lib/ledger/writer.ts`):**

```
1. API route calls writer.appendEvent(tenantId, caseId, eventType, actor, payload)
2. AsyncMutex acquired (prevents concurrent writes within single PM2 process)
3. readPrevHash() reads last line of ledger/cases/{tenantId}/{caseId}/events.jsonl
   → Returns GENESIS_HASH if file absent/empty
4. event_hash = SHA256( canonicalize(event_without_hash) + prev_hash )
   → canonicalize = RFC 8785 (JCS): keys sorted lexicographically, no whitespace
5. REPO FIRST: fs.appendFileSync() writes JSON line to JSONL file
6. DB SECOND: versioned projector inserts into caseLedgerEvents + updates cases table
7. If DB fails → addToRetryQueue(event) + createIncidentIssue("PROJECTION_UPDATE_FAILED")
8. Mutex released
```

### 1.2 Single Writer

- ALL ledger writes go through `core/web/src/lib/ledger/writer.ts` → `appendEvent()`
- API routes MUST call `appendEvent()`, NEVER call `db.insert(caseLedgerEvents)` directly
- NEVER call `fs.appendFileSync` for ledger files from anywhere except `writer.ts`
- PM2 must run in `fork` mode (single instance) to preserve mutex guarantees

### 1.3 Tenant Boundary

- Every case lives under `ledger/cases/{tenantId}/{caseId}/events.jsonl`
- All case API routes MUST call `requireTenantMatch(session, tenantId)` from `core/web/src/lib/tenant/guard.ts`
- `session.user.tenantId` is set by NextAuth session callback, stored in `users.tenant_id`

### 1.4 DB as Rebuildable Projection

- DB failure is recoverable — JSONL is the single source of truth
- Rebuild: `replayFromLedger(tenantId, caseId)` from `core/web/src/lib/ledger/engine.ts`
- In-process retry queue: up to 5 attempts before flagging for manual intervention (`core/web/src/lib/ledger/projection-retry.ts`)

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 20 |
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| UI Components | shadcn/ui + Tailwind CSS | tailwindcss 4 |
| Charts | Recharts | 3.7.0 |
| ORM | Drizzle ORM | 0.45.1 |
| ORM Toolkit | Drizzle Kit | 0.31.9 |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| Auth Adapter | @auth/drizzle-adapter | 1.11.1 |
| SQLite Driver | better-sqlite3 | 12.6.2 |
| PostgreSQL Driver | postgres | 3.4.8 |
| GitHub API | @octokit/rest + @octokit/auth-app | 22.0.1 / 8.2.0 |
| Schema Validation | AJV + ajv-formats | 8.18.0 / 3.0.1 |
| ZIP Generation | archiver | 7.0.1 |
| AI: Anthropic | @anthropic-ai/sdk | 0.78.0 |
| AI: OpenAI | openai | 6.25.0 |
| AI: Google | @google/generative-ai | 0.24.1 |
| ID Generation | nanoid | 5.1.6 |
| Script Runner | tsx | (dev dependency) |
| Package Manager | pnpm | >= 9 |
| Deploy | PM2 + Nginx Proxy Manager | — |

---

## 3. Directory Structure

```
/ (repo root)
├── CLAUDE.md                        ← This file (maintenance reference)
├── README.md                        User-facing platform guide (繁體中文)
├── .env.example                     Environment variable template
├── ecosystem.config.js              PM2 config (fork mode, port 3000)
├── pnpm-workspace.yaml              Monorepo (single package: core/web)
│
├── core/                            All application code
│   ├── CLAUDE.md                    Code conventions for core/
│   ├── web/                         Next.js application
│   │   ├── package.json             Dependencies & npm scripts
│   │   ├── drizzle.config.ts        Dual-dialect Drizzle Kit config
│   │   ├── next.config.ts           Next.js config (serverExternalPackages: better-sqlite3)
│   │   └── src/
│   │       ├── auth.ts              NextAuth v5 config (lazy init, Google + LINE)
│   │       ├── middleware.ts         Auth redirect guard (all routes except /login, /api/auth)
│   │       ├── app/
│   │       │   ├── layout.tsx       Root layout (HTML shell, providers)
│   │       │   ├── page.tsx         Root redirect → /dashboard
│   │       │   ├── login/           Public login page (Google + LINE buttons)
│   │       │   ├── (app)/           Authenticated route group (sidebar + header layout)
│   │       │   │   ├── layout.tsx   Sidebar + header shell
│   │       │   │   ├── dashboard/   Stats, KRI chart, heatmap, activity feed
│   │       │   │   ├── cases/       Case list, new, [caseId] detail + event timeline
│   │       │   │   ├── governance/  Controls, roles, RACI, framework-mapping
│   │       │   │   ├── audit/       Samples, findings, evidence-packs
│   │       │   │   ├── qms/         Risk register, document index, complaints
│   │       │   │   ├── chat/        AI chat with @mention routing
│   │       │   │   └── settings/    Users, system, AI providers
│   │       │   └── api/             REST API (Next.js Route Handlers)
│   │       │       ├── auth/[...nextauth]/  NextAuth endpoints
│   │       │       ├── cases/               + [caseId]/events, [caseId]/verify
│   │       │       ├── governance/          controls, framework-mapping, raci, role-matrix
│   │       │       ├── audit/               samples, findings, evidence-packs
│   │       │       ├── qms/                 risk-register, document-index, complaints
│   │       │       ├── chat/                conversations + [id]/messages, [id]/stream
│   │       │       ├── dashboard/           stats, kri, heatmap, activity
│   │       │       └── settings/            ai-providers, users, system, github-status
│   │       ├── components/
│   │       │   ├── app-sidebar.tsx           Main nav (7 items, permission-filtered)
│   │       │   ├── app-header.tsx            Breadcrumb + user menu
│   │       │   ├── theme-provider.tsx        Dark/light (useSyncExternalStore)
│   │       │   ├── providers.tsx             Client providers wrapper
│   │       │   ├── ui/                       shadcn primitives (20 components)
│   │       │   ├── dashboard/               stat-card, kri-chart, control-heatmap, activity-feed
│   │       │   ├── cases/                   case-status-badge, event-timeline, hash-chain-indicator
│   │       │   ├── audit/                   finding-status-badge, sample-status-badge, severity-badge
│   │       │   ├── governance/              domain-filter, framework-badge, governance-nav, risk-tier-badge
│   │       │   ├── qms/                     complaint-status-badge, doc-type-badge, kri-status-badge
│   │       │   └── chat/                    chat-input, conversation-list, mention-autocomplete, message-bubble
│   │       └── lib/
│   │           ├── db/
│   │           │   ├── index.ts             DB factory (sqlite/pg via DB_DRIVER env)
│   │           │   ├── schema.ts            SQLite schema (canonical, 17 tables)
│   │           │   ├── schema-pg.ts         PostgreSQL mirror schema
│   │           │   └── seed.ts              30 controls + system settings
│   │           ├── auth/
│   │           │   ├── roles.ts             6 roles + ROLE_PERMISSIONS map
│   │           │   ├── guard.ts             requireAuth / requireRole / requirePermission
│   │           │   └── line-provider.ts     Custom LINE OAuth provider
│   │           ├── ledger/
│   │           │   ├── writer.ts            Single writer (AsyncMutex, repo-first)
│   │           │   ├── engine.ts            verifyChain, verifyDbConsistency, replayFromLedger
│   │           │   ├── projection-retry.ts  In-memory retry queue (MAX_RETRIES=5)
│   │           │   ├── types.ts             LedgerEvent, LedgerEventType, CaseStatus
│   │           │   ├── hash.ts              Re-export from core/lib/hash.ts
│   │           │   └── projectors/
│   │           │       ├── registry.ts      Version → projector map
│   │           │       └── v1.ts            v1 projector (12 event types)
│   │           ├── audit/
│   │           │   ├── sampling.ts          Mulberry32 PRNG, Fisher-Yates, CSV headers
│   │           │   ├── deviation-checker.ts 5 deviation type checkers
│   │           │   └── evidence-pack.ts     Deterministic ZIP (archiver)
│   │           ├── ai/
│   │           │   ├── types.ts             AIAdapter interface, AIMessage, AIStreamChunk
│   │           │   ├── provider-registry.ts Cached provider map from DB
│   │           │   ├── router.ts            parseMessage() + routeMessage() (@mention)
│   │           │   └── adapters/            anthropic.ts, openai.ts, google.ts
│   │           ├── github/
│   │           │   ├── app-auth.ts          GitHub App JWT → Octokit singleton
│   │           │   └── issues.ts            CRUD + createFindingIssue, createIncidentIssue
│   │           ├── tenant/
│   │           │   └── guard.ts             requireTenantMatch, verifyTenantAccess
│   │           ├── nav-config.ts            7 nav items with requiredPermission
│   │           └── utils.ts                 cn() tailwind class merging
│   │
│   ├── schemas/                             12 JSON Schemas (v1.0.0)
│   │   ├── case-ledger-event.schema.json
│   │   ├── control-inventory.schema.json
│   │   ├── control-framework-mapping.schema.json
│   │   ├── evidence-pack-manifest.schema.json
│   │   ├── findings-log.schema.json
│   │   ├── risk-register.schema.json
│   │   ├── document-index.schema.json
│   │   ├── role-matrix.schema.json
│   │   ├── raci-matrix.schema.json
│   │   ├── complaint-log.schema.json
│   │   ├── process-map.schema.json
│   │   ├── sample-selection.schema.json
│   │   └── CHANGELOG.md
│   │
│   ├── scripts/                             CLI tools (run with npx tsx)
│   │   ├── validate-schemas.ts
│   │   ├── verify-chains.ts
│   │   ├── generate-evidence-pack.ts
│   │   ├── select-samples.ts
│   │   ├── init-ledger.ts
│   │   └── replay-from-ledger.ts
│   │
│   └── lib/                                 Framework-agnostic shared library
│       ├── hash.ts                          SHA256, canonicalize (RFC 8785), event hash
│       ├── validation.ts                    AJV-based JSON Schema validation
│       └── gpg.ts                           GPG signature verification
│
├── ledger/                                  Append-only event store (source of truth)
│   ├── cases/{tenantId}/{caseId}/events.jsonl
│   ├── governance/
│   ├── qms/process-map.json
│   └── audit/
│       ├── evidence-pack-config.json
│       ├── sample-selection/
│       └── system-releases/
│
├── artifacts/                               Human-uploaded documents (via Web UI)
│
├── .github/
│   ├── CODEOWNERS
│   ├── ISSUE_TEMPLATE/                      finding, deviation, complaint, change-request
│   └── workflows/                           7 workflows (see Section 13)
│
└── prompt/
    └── typeII-master-pack/v1.md             30 controls + 3 framework mappings
```

---

## 4. Coding Conventions

- **Language**: TypeScript strict mode, no `any` types
- **Formatting**: Prettier (default config)
- **Linting**: ESLint (Next.js recommended, eslint-config-next)
- **Imports**: `@/` alias resolves to `core/web/src/`
- **Naming**: camelCase (variables/functions), PascalCase (types/components), kebab-case (files)
- **Exports**: Named exports preferred; `page.tsx` uses default export (Next.js requirement)
- **Shared code**: `core/lib/` must be framework-agnostic (no Next.js imports)
- **IDs**: `nanoid` for all generated IDs (case IDs: `case-${nanoid(12)}`)

---

## 5. Database

### 5.1 Dual Driver Setup

```
DB_DRIVER=sqlite     → better-sqlite3  → schema: core/web/src/lib/db/schema.ts (canonical)
DB_DRIVER=postgresql → postgres driver  → schema: core/web/src/lib/db/schema-pg.ts (mirror)
```

Client factory: `core/web/src/lib/db/index.ts` (singleton, SQLite uses WAL + 5s busy timeout)

### 5.2 Tables (17)

| Table | Purpose |
|---|---|
| `users` | NextAuth users + role + tenantId |
| `accounts` | OAuth account links (Google/LINE) |
| `sessions` | Database sessions (not JWT) |
| `verificationTokens` | Magic link tokens |
| `aiProviders` | AI provider configs (anthropic/openai/google) |
| `conversations` | Chat conversation threads |
| `messages` | Chat messages with aiProviderId |
| `cases` | Engagement cases (projection from ledger) |
| `caseLedgerEvents` | Event store projection (index only, truth is JSONL) |
| `controls` | 30 audit controls (6 domains: AC/CM/PI/CF/IR/MN) |
| `findings` | Audit findings with GitHub Issue link |
| `evidencePacks` | Generated ZIP packs with pack_hash + signing |
| `riskRegisters` | QMS risk register with KRI thresholds |
| `auditSamples` | Sampling runs with seed + operator + commit SHA |
| `complaints` | QMS complaints with GitHub Issue link |
| `documentIndex` | QMS document registry |
| `systemSettings` | Key-value system configuration |

### 5.3 Commands (run from `core/web/`)

```bash
pnpm db:generate   # Generate migration files (drizzle-kit generate)
pnpm db:push       # Push schema to DB without migration (dev only)
pnpm db:migrate    # Run migrations (drizzle-kit migrate)
pnpm db:studio     # Open Drizzle Studio visual browser
pnpm db:seed       # Seed 30 controls + system settings (INSERT OR REPLACE, safe to re-run)
```

### 5.4 Schema Change Rules

1. ALWAYS update BOTH `schema.ts` (SQLite) AND `schema-pg.ts` (PostgreSQL)
2. Open a change-request GitHub Issue (use `change-request.yml` template)
3. Dual approval PR required (enforced by CODEOWNERS)
4. Run `pnpm db:generate` → `pnpm db:migrate`
5. Update `seed.ts` if new tables need seeded data
6. If changes affect ledger events, also update `core/schemas/case-ledger-event.schema.json`

---

## 6. Authentication

### 6.1 Config

- NextAuth v5 beta with `DrizzleAdapter` — `core/web/src/auth.ts`
- Session strategy: `database` (not JWT)
- Lazy initialization: NextAuth not instantiated at module load time (avoids `DATABASE_URL` errors during `next build`)
- Session callback adds `id`, `role`, `tenantId` to `session.user`
- New users default to role `viewer`

### 6.2 Role → Permission Matrix

Source of truth: `core/web/src/lib/auth/roles.ts`

| Permission | engagement-partner | quality-manager | tech-lead | system-admin | auditor | viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| cases:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| cases:create | ✓ | ✓ | ✓ | | | |
| cases:approve | ✓ | ✓ | | | | |
| cases:deliver | ✓ | | | | | |
| findings:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| findings:manage | ✓ | ✓ | ✓ | | | |
| governance:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| governance:manage | ✓ | ✓ | | | | |
| audit:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| audit:manage | ✓ | ✓ | | | | |
| audit:sign | | ✓ | | | | |
| qms:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| qms:manage | ✓ | ✓ | | | | |
| chat:use | ✓ | ✓ | ✓ | ✓ | | |
| settings:read | ✓ | ✓ | ✓ | ✓ | | |
| settings:manage | | | ✓ | ✓ | | |
| users:manage | | | | ✓ | | |
| sampling:execute | | ✓ | | | ✓ | |
| complaints:manage | ✓ | | | | | |

### 6.3 Guard Helpers

```typescript
// core/web/src/lib/auth/guard.ts
import { requireAuth, requirePermission, requireRole, authErrorResponse } from "@/lib/auth/guard";

// In API route handlers:
const session = await requirePermission("cases:create");
// Throws if unauthorized — catch with authErrorResponse() for JSON response
```

### 6.4 Middleware

`core/web/src/middleware.ts` — redirects all non-public paths to `/login` if no session.
Public paths: `/login`, `/api/auth/*`.

---

## 7. Ledger System

### 7.1 Event Types (12)

Source: `core/web/src/lib/ledger/types.ts`

| Event Type | DB Side-Effect |
|---|---|
| `CASE_CREATED` | Insert `cases` row |
| `STATUS_CHANGED` | Update `cases.status` |
| `NOTE_ADDED` | — (payload: `{ note }`) |
| `DOCUMENT_ATTACHED` | — (payload: `{ filename, hash }`) |
| `DOCUMENT_REMOVED` | — (payload: `{ filename }`) |
| `ASSIGNMENT_CHANGED` | Update `cases.assigned_to` |
| `FINDING_LINKED` | — (payload: `{ findingId }`) |
| `FINDING_UNLINKED` | — (payload: `{ findingId }`) |
| `REVIEW_REQUESTED` | — |
| `REVIEW_COMPLETED` | — (payload: `{ outcome }`) |
| `CASE_DELIVERED` | — |
| `CASE_ARCHIVED` | — |

All events are also inserted into `caseLedgerEvents` table by the projector.

### 7.2 Case Statuses (5)

`draft` → `active` → `review` → `delivered` → `archived`

### 7.3 LedgerEvent Interface

```typescript
interface LedgerEvent {
  event_type: LedgerEventType;
  timestamp: string;              // ISO 8601
  actor: string;                  // user ID
  event_hash: string;             // "sha256:<hex>"
  prev_hash: string;              // "sha256:<hex>" (GENESIS for first event)
  event_schema_version: string;   // "1.0.0" — ALWAYS include
  tenant_id: string;
  case_id: string;
  payload: Record<string, unknown>;
}
```

### 7.4 Hash Chain

```
GENESIS_HASH = "sha256:0000000000000000000000000000000000000000000000000000000000000000"

event_hash = SHA256( canonicalize(event_without_hash) + prev_hash )

canonicalize = RFC 8785 (JCS):
  - Object keys sorted lexicographically
  - No whitespace
  - No undefined values
  - Arrays preserve order
```

Implementation: `core/lib/hash.ts`

### 7.5 Projector Registry

- `core/web/src/lib/ledger/projectors/registry.ts` — version → projector map
- Currently: `"1"` and `"1.0.0"` both map to `projectEventV1`
- Falls back to v1 with warning if unknown version encountered
- New schema versions MUST be registered here

### 7.6 Verification

- `verifyChain(tenantId, caseId)` — re-computes every hash from JSONL
- `verifyDbConsistency(tenantId, caseId)` — compares event_hash sets between JSONL and DB
- `replayFromLedger(tenantId, caseId)` — deletes DB rows and re-projects from JSONL

All in `core/web/src/lib/ledger/engine.ts`.

---

## 8. API Routes

### Cases

| Method | Path | Permission |
|---|---|---|
| GET | `/api/cases` | cases:read |
| POST | `/api/cases` | cases:create (calls `appendEvent` with CASE_CREATED) |
| GET | `/api/cases/[caseId]` | cases:read |
| PATCH | `/api/cases/[caseId]` | cases:create (appends ledger event) |
| GET | `/api/cases/[caseId]/events` | cases:read |
| GET | `/api/cases/[caseId]/verify` | cases:read |

### Governance

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/governance/controls` | governance:read / governance:manage |
| GET/PATCH | `/api/governance/controls/[controlId]` | governance:read / governance:manage |
| GET | `/api/governance/framework-mapping` | governance:read |
| GET | `/api/governance/raci-matrix` | governance:read |
| GET | `/api/governance/role-matrix` | governance:read |

### Audit

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/audit/samples` | audit:read / sampling:execute |
| GET | `/api/audit/samples/[sampleId]` | audit:read |
| GET/POST | `/api/audit/findings` | audit:read / audit:manage |
| GET/PATCH | `/api/audit/findings/[findingId]` | audit:read / audit:manage |
| GET/POST | `/api/audit/evidence-packs` | audit:read / audit:manage |
| GET | `/api/audit/evidence-packs/[packId]` | audit:read |

### QMS

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/qms/risk-register` | qms:read / qms:manage |
| GET/PATCH/DELETE | `/api/qms/risk-register/[riskId]` | qms:read / qms:manage |
| GET/POST | `/api/qms/document-index` | qms:read / qms:manage |
| GET/PATCH/DELETE | `/api/qms/document-index/[documentId]` | qms:read / qms:manage |
| GET/POST | `/api/qms/complaints` | qms:read / qms:manage |
| GET/PATCH | `/api/qms/complaints/[complaintId]` | qms:read / qms:manage |

### Chat

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/chat/conversations` | chat:use |
| GET/DELETE | `/api/chat/conversations/[conversationId]` | chat:use |
| GET/POST | `/api/chat/conversations/[conversationId]/messages` | chat:use |
| POST | `/api/chat/conversations/[conversationId]/stream` | chat:use (SSE) |

### Dashboard

| Method | Path | Permission |
|---|---|---|
| GET | `/api/dashboard/stats` | (authenticated) |
| GET | `/api/dashboard/kri` | (authenticated) |
| GET | `/api/dashboard/heatmap` | (authenticated) |
| GET | `/api/dashboard/activity` | (authenticated) |

### Settings

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/settings/ai-providers` | settings:read / settings:manage |
| GET/PATCH/DELETE | `/api/settings/ai-providers/[providerId]` | settings:manage |
| POST | `/api/settings/ai-providers/[providerId]/test` | settings:manage |
| GET/PATCH | `/api/settings/users` | users:manage |
| GET/PATCH | `/api/settings/system` | settings:manage |
| GET | `/api/settings/github-status` | settings:read |

---

## 9. JSON Schemas

12 schemas at `core/schemas/`, all version `1.0.0`:

| Schema | Purpose |
|---|---|
| `case-ledger-event` | Event sourcing events (21 types, hash chain) |
| `control-inventory` | 30 controls, 17 fields per control |
| `control-framework-mapping` | SOC1 / ISQM1 / ISO9001 cross-reference |
| `evidence-pack-manifest` | Deterministic pack manifest (SHA-256, signing) |
| `findings-log` | Audit findings (3 severity levels) |
| `risk-register` | Risk scoring + KRI thresholds |
| `document-index` | QMS document lifecycle |
| `role-matrix` | Role permissions per resource |
| `raci-matrix` | Control-to-role RACI assignments |
| `complaint-log` | Client complaint tracking |
| `process-map` | SIPOC process map (ISO9001) |
| `sample-selection` | Sampling records (seed, operator, commit SHA) |

- Runtime validation: `core/lib/validation.ts` (AJV-based)
- CI validation: `validate.yml` → `npx tsx core/scripts/validate-schemas.ts`
- Schema changes: change-request Issue → dual-approval PR → bump version

---

## 10. GitHub Integration

- **GitHub App** (NOT PAT): `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID`
- Octokit singleton: `core/web/src/lib/github/app-auth.ts`
- `GITHUB_REPOSITORY` = `"owner/repo"` format
- Auto-creates Issues for: findings, incidents (PROJECTION_UPDATE_FAILED), complaints
- 4 Issue templates: `finding.yml`, `deviation.yml`, `complaint.yml`, `change-request.yml`
- CODEOWNERS enforces dual approval:
  - `/ledger/` → `@quality-manager`
  - `/ledger/governance/`, `/core/schemas/` → `@quality-manager @engagement-partner`
  - `/core/web/` → `@tech-lead`
  - `/.github/workflows/` → `@tech-lead @quality-manager`

---

## 11. AI System

- 3 adapters: `AnthropicAdapter`, `OpenAIAdapter`, `GoogleAIAdapter` in `core/web/src/lib/ai/adapters/`
- All implement `AIAdapter` interface (`send()`, `streamMessage()`)
- Provider configs stored in DB table `aiProviders` (enabled flag)
- Cached registry: `core/web/src/lib/ai/provider-registry.ts`
- **IMPORTANT**: Call `invalidateProviderCache()` after any change to `aiProviders` table
- `@mention` routing (`core/web/src/lib/ai/router.ts`):
  - `@all-ai` → fan-out to all enabled providers
  - `@{provider-name}` → case-insensitive match
  - No mention → message saved only, no AI response
- SSE streaming: responses via `AsyncGenerator<AIStreamChunk>`
- API keys: environment variables ONLY (NEVER in DB or code)

---

## 12. CI/CD Workflows

| Workflow | File | Trigger | Action |
|---|---|---|---|
| Validate | `validate.yml` | PR to main | pnpm lint → build → validate-schemas |
| GPG Verify | `gpg-verify.yml` | PR to main | Verify all commits GPG signed |
| Hash Verification | `hash-verification.yml` | Daily 06:00 UTC + manual | verify-chains.ts on all JSONL |
| Evidence Pack | `evidence-pack.yml` | Manual (period + signer) | generate-evidence-pack.ts |
| Sample Selection | `sample-selection.yml` | Manual (period + seed) | select-samples.ts |
| Subservice Review | `subservice-review.yml` | Annual Jan 15 + manual | Creates review Issue |
| Issue Sync | `issue-sync.yml` | Issue events | Logs issue changes (finding/complaint sync) |

---

## 13. CLI Scripts

Run from repo root with `npx tsx`:

```bash
npx tsx core/scripts/validate-schemas.ts
# Validates all .schema.json files (structure, cross-references). Exit 0/1.

npx tsx core/scripts/verify-chains.ts
# Reads all events.jsonl, re-computes every hash chain. Exit 0/1.

npx tsx core/scripts/select-samples.ts --period 2025-Q1 --seed 42 [--domain AC]
# Deterministic sampling. Outputs CSV + JSON to ledger/audit/sample-selection/.

npx tsx core/scripts/generate-evidence-pack.ts --period 2025-Q1 --signer <userId>
# Collects ledger/ + artifacts/, generates deterministic ZIP + manifest.

npx tsx core/scripts/init-ledger.ts
# Creates ledger/ directory structure with .gitkeep files. Idempotent.

npx tsx core/scripts/replay-from-ledger.ts [--tenant <tid>] [--case <cid>]
# Rebuilds DB projections from JSONL (diagnostic mode).
```

---

## 14. Critical Rules

- NEVER write to `ledger/` directly from API routes — use `writer.ts`
- NEVER store API keys in DB or code — `.env` only
- NEVER skip schema validation on ledger writes
- ALWAYS include `event_schema_version` in ledger events
- ALWAYS enforce tenant boundary in API routes
- Evidence Pack ZIP must be deterministic (lexicographic sort, fixed compression)
- Schema changes require change-request Issue + dual approval PR

---

## 15. Maintenance Patterns

### 15.1 Adding a New API Route

```
1. Create route file: core/web/src/app/api/{domain}/route.ts
2. Add auth guard:
   import { requirePermission, authErrorResponse } from "@/lib/auth/guard";
   const session = await requirePermission("domain:action");
3. For ledger writes, call:
   await appendEvent(tenantId, caseId, "EVENT_TYPE", session.user.id, payload);
   ⚠ NEVER: db.insert(caseLedgerEvents).values(...)
4. For reads, use db.select() from Drizzle schema
5. For tenant-scoped data, add: requireTenantMatch(session, tenantId)
```

### 15.2 Adding a New Ledger Event Type

```
1. Add type to LedgerEventType union:
   core/web/src/lib/ledger/types.ts

2. Add handling in projector (if the event needs DB side-effects):
   core/web/src/lib/ledger/projectors/v1.ts

3. Add type to case-ledger-event.schema.json:
   core/schemas/case-ledger-event.schema.json

4. If changing event structure, bump event_schema_version:
   → Create new projector (vN.ts)
   → Register in core/web/src/lib/ledger/projectors/registry.ts
```

### 15.3 Adding a New Page

```
1. Create: core/web/src/app/(app)/{section}/page.tsx
   (default export, async Server Component)
   The (app) route group auto-applies sidebar + header layout

2. Add permission guard if needed:
   import { requirePermission } from "@/lib/auth/guard";
   const session = await requirePermission("permission:name");

3. Add nav item (if sidebar entry needed):
   core/web/src/lib/nav-config.ts

4. Use existing components from:
   core/web/src/components/ui/          (shadcn primitives)
   core/web/src/components/{domain}/    (domain components)
```

### 15.4 Modifying DB Schema

```
1. Update BOTH schema files:
   core/web/src/lib/db/schema.ts       (SQLite, canonical)
   core/web/src/lib/db/schema-pg.ts    (PostgreSQL, mirror)

2. Open change-request GitHub Issue (change-request.yml template)

3. Run: pnpm db:generate  (creates migration)
4. Run: pnpm db:migrate   (applies migration)

5. Update seed.ts if new tables need seeded data

6. If change affects ledger events:
   Update core/schemas/case-ledger-event.schema.json
```

### 15.5 Adding a New Control

```
1. Assign control to domain (AC/CM/PI/CF/IR/MN) per Master Pack

2. Add to seed script:
   core/web/src/lib/db/seed.ts
   (must match all fields in controls table)

3. Add framework mapping (SOC1/ISQM1/ISO9001)

4. Re-run: pnpm db:seed (safe — uses INSERT OR REPLACE)
```

### 15.6 Evidence Pack Determinism Rules

```
MUST maintain for audit reproducibility:
- File sort:    a.path.localeCompare(b.path) (lexicographic)
- Compression:  deflate level 6 (zlib: { level: 6 })
- Timestamps:   EPOCH_DATE = new Date(1980, 0, 1, 0, 0, 0) on every entry
- Order:        manifest.json first, then sorted files
- Hash:         pack_hash = SHA256(zip_bytes)
- Same inputs MUST produce identical pack_hash every time
```

### 15.7 Adding a New AI Provider

```
1. Implement AIAdapter in:
   core/web/src/lib/ai/adapters/{provider}.ts

2. Register in createAdapter() switch:
   core/web/src/lib/ai/provider-registry.ts

3. Add provider type to DB (aiProviders.provider_type)

4. ⚠ Call invalidateProviderCache() after any aiProviders DB change

5. API key via env var ONLY (NEVER in DB or code)
```

### 15.8 Tenant Safety Checklist (for new API routes touching case data)

```
[ ] Call requireTenantMatch(session, tenantId) from @/lib/tenant/guard
[ ] Pass tenantId to appendEvent() and all DB queries
[ ] Never trust tenantId from request body alone — validate against session
```
