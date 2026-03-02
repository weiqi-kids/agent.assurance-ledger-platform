# core/ — Code Conventions

All application code lives here.

## Structure
- `web/` — Next.js 15 application (App Router)
- `schemas/` — JSON Schema definitions (versioned)
- `scripts/` — CLI tools for CI/CD and operations
- `lib/` — Shared library (hash, validation) used by both web and scripts

## Rules
- TypeScript strict mode, no `any` types
- Use `@/` import alias for web app imports
- Shared code in `lib/` must be framework-agnostic (no Next.js imports)
- All exports must have explicit types
- Prefer named exports over default exports
