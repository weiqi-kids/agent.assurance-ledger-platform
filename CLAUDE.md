# Assurance Ledger Platform

## Project Overview
SOC1 Type II / ISQM1 / ISO9001 三框架審計就緒平台。
GitHub repo 為不可變證據庫，Next.js Web UI 供客戶操作。

## Architecture Principles

### Event Sourcing (Repo first)
- `ledger/` = Event Store (append-only JSONL, source of truth)
- DB (Drizzle) = Projection (read model, rebuildable)
- Write order: Repo JSONL first → DB projection second
- DB failure → `PROJECTION_UPDATE_FAILED` + retry queue

### Single Writer
- All ledger writes go through `core/web/lib/ledger/writer.ts`
- API routes MUST call `writer.appendEvent()`, NEVER insert directly
- Mutex + transactional append guarantees hash chain integrity

### Tenant Boundary
- Ledger paths include tenantId: `ledger/cases/{tenantId}/{caseId}/`
- API middleware enforces tenant isolation

## Tech Stack
- Runtime: Node.js + Next.js 15 (App Router)
- UI: shadcn/ui + Tailwind CSS
- ORM: Drizzle ORM (SQLite ↔ PostgreSQL via `DB_DRIVER` env)
- Auth: NextAuth.js + Google OAuth + LINE OAuth
- GitHub: GitHub App (installation token, NOT PAT)
- Package Manager: pnpm
- Deploy: PM2 + Nginx Proxy Manager

## Directory Structure
```
core/          → All code (web app, schemas, scripts, shared lib)
ledger/        → System-maintained records (append-only, source of truth)
artifacts/     → Human-uploaded documents (via Web UI)
.github/       → Issue templates, workflows, CODEOWNERS
prompt/        → Specification documents (Master Pack)
```

## Coding Conventions
- Language: TypeScript (strict mode)
- Formatting: Prettier (default config)
- Linting: ESLint (Next.js recommended)
- Imports: Use `@/` path alias for `core/web/`
- Naming: camelCase for variables/functions, PascalCase for types/components
- Files: kebab-case for file names

## Critical Rules
- NEVER write to ledger/ directly from API routes — use writer.ts
- NEVER store API keys in DB or code — .env only
- NEVER skip schema validation on ledger writes
- ALWAYS include `event_schema_version` in ledger events
- ALWAYS enforce tenant boundary in API routes
- Evidence Pack ZIP must be deterministic (lexicographic sort, fixed compression)
- Schema changes require change-request Issue + dual approval PR

## Specification
- Master Pack: `prompt/typeII-master-pack/v1.md`
- All 30 controls defined in Section 1
- Three framework mappings in Section 2 (SOC1/ISQM1/ISO9001)
- Sampling matrix in Section 3
- Evidence pack structure in Section 4
