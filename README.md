# Assurance Ledger Platform

SOC1 Type II / ISQM1 / ISO9001 三框架審計就緒平台。

## Architecture

```
Client Browser ──HTTPS──→ Nginx Proxy Manager (SSL) ──HTTP──→ PM2 (Next.js :3000)
                                                                    │
                                                         ┌──────────┴──────────┐
                                                         │                     │
                                                    Drizzle ORM          GitHub API
                                                   (SQLite/PG)         (GitHub App)
                                                         │                     │
                                                      DB (projection)    Repo (source of truth)
```

### Event Sourcing

```
ledger/ (Repo)  = Event Store — append-only JSONL, immutable evidence
DB (Drizzle)    = Projection  — queryable index for UI, rebuildable from ledger
```

Write order: Repo first → DB second (eventually consistent).

### Directory Structure

```
core/          Code (Next.js app, schemas, scripts, shared lib)
ledger/        System-maintained audit records (source of truth)
artifacts/     Human-uploaded documents
.github/       Issue templates, CI/CD workflows, CODEOWNERS
prompt/        Specification documents
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 |
| UI | shadcn/ui + Tailwind CSS |
| Database | Drizzle ORM (SQLite / PostgreSQL) |
| Auth | NextAuth.js + Google OAuth + LINE OAuth |
| GitHub | GitHub App (installation token) |
| AI Chat | Multi-provider adapter (Anthropic, OpenAI, Google) |
| Deploy | PM2 + Nginx Proxy Manager |
| Package Manager | pnpm |

## Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Git

### Installation

```bash
git clone https://github.com/<owner>/assurance-ledger-platform.git
cd assurance-ledger-platform
cp .env.example .env
# Edit .env with your credentials
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Production (PM2)

```bash
pnpm build
pm2 start ecosystem.config.js
```

### Nginx Proxy Manager

1. Add Proxy Host pointing to `http://localhost:3000`
2. Enable SSL with Let's Encrypt
3. Set OAuth callback URLs:
   - Google: `https://your-domain.com/api/auth/callback/google`
   - LINE: `https://your-domain.com/api/auth/callback/line`

## Environment Variables

See `.env.example` for all required variables.

## License

Proprietary
