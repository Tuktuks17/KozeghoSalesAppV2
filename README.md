# Kozegho Sales App

Internal sales/CPQ app for customer management, proposal creation, document generation, and pipeline follow-up.

## Stack
- React + TypeScript + Vite
- Supabase (primary backend)
- Mock backend fallback (optional)
- Tailwind CSS

## Requirements
- Node.js 20+
- npm 10+

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file from template:
   ```bash
   cp .env.example .env
   ```
3. Fill required variables (see below).

## Environment Variables
- `VITE_BACKEND_MODE`: `auto` | `supabase` | `mock`
- `VITE_SUPABASE_URL`: required in `supabase` mode
- `VITE_SUPABASE_ANON_KEY`: required in `supabase` mode
- `VITE_GEMINI_API_KEY`: optional, used for AI email generation
- `VITE_DEBUG_AUTH`: optional (`true`/`false`)

Optional Google Apps Script integration:
- `VITE_SHEETS_API_URL`
- `VITE_GENERATE_DOC_WEBAPP_URL`
- `VITE_SEND_EMAIL_WEBAPP_URL`
- `VITE_PROPOSALS_SHEET_ID`
- `VITE_PROPOSALS_SHEET_NAME`
- `VITE_TEMPLATE_DOC_ID`
- `VITE_OUTPUT_FOLDER_ID`

## Backend Mode Behavior
- `VITE_BACKEND_MODE=supabase`: forces Supabase. If env vars are missing, app returns clear config errors.
- `VITE_BACKEND_MODE=mock`: forces mock services.
- `VITE_BACKEND_MODE=auto`: uses Supabase when configured, otherwise mock.

## Database
Source of truth:
- `/supabase/schema.sql`

Migration file:
- `/supabase/migrations/20260220_000001_core_schema.sql`

Legacy schema moved to:
- `/supabase/legacy/schema_old_pre_hardening.sql`

## Supabase Setup
1. Create project.
2. Run `/supabase/schema.sql` in SQL editor.
3. Create storage bucket `proposals` (private or controlled access).
4. Configure RLS and auth settings according to `/supabase/schema.sql`.

## Commands
- Dev server:
  ```bash
  npm run dev
  ```
- Production build:
  ```bash
  npm run build
  ```
- Preview build:
  ```bash
  npm run preview
  ```
- Typecheck:
  ```bash
  npm run typecheck
  ```
- Lint:
  ```bash
  npm run lint
  ```
- Tests:
  ```bash
  npm run test
  ```

## Smoke Script
Supabase smoke test script:
```bash
npx tsx scripts/supabase-smoke-test-client.ts
```

## Troubleshooting
- If login/API operations fail in `supabase` mode, validate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- If AI email generation returns fallback content, verify `VITE_GEMINI_API_KEY`.
- If in `mock` mode, auth uses local storage and does not hit Supabase.
