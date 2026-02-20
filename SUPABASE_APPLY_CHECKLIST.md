# Supabase Apply Checklist

## Current Status
- Remote schema migration **not applied by Codex** (no write/admin credential provided in this sprint).
- Core SQL ready at:
  - `supabase/migrations/20260220_000001_core_schema.sql`
  - `supabase/schema.sql` (same source of truth)

## Option A — Manual via Supabase SQL Editor (recommended now)
1. Open Supabase project dashboard.
2. Go to **SQL Editor**.
3. Paste contents of `supabase/migrations/20260220_000001_core_schema.sql`.
4. Execute query.
5. Validate objects exist:
   - `organizations`
   - `profiles`
   - `customers`
   - `proposals`
   - `proposal_lines`
   - `proposal_line_options`
   - `tasks`
   - `audit_logs`
6. Validate indexes and triggers were created.
7. Confirm RLS is enabled on those tables.
8. Create storage bucket `proposals` if missing.

## Option B — Supabase CLI (requires token)
Prerequisites required from Afonso:
- `SUPABASE_ACCESS_TOKEN`
- `project_ref`

Commands:
```bash
supabase login
supabase link --project-ref <project_ref>
# Apply SQL manually in editor or adapt to migration history workflow
```

## Post-Apply Validation
1. Run smoke script:
```bash
npx tsx scripts/supabase-smoke-test-client.ts
```
2. Set `.env.local` for supabase mode:
```env
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
3. Run app and validate persistence (create client/proposal, refresh page):
```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

## Notes
- If auth requires email confirmation, use a pre-created test user for deterministic UI QA.
- Do not store service role key in repo files.
