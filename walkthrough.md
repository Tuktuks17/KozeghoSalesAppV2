# Kozegho Sales App Walkthrough

## Backend Architecture
- API facade: `services/api.ts`
- Modes:
  - `supabase`: force Supabase
  - `mock`: force mock service
  - `auto`: Supabase if configured, otherwise mock

Runtime selection is driven by:
- `VITE_BACKEND_MODE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Main User Flow
1. Login (`/login`)
2. Create/select client (`/create`)
3. Add proposal lines (catalog + configurable options)
4. Save draft
5. Generate document (`/proposal/:id/document`)
6. Send/track status in proposal detail (`/proposal/:id`)

## Data Layer
- Repositories:
  - `services/repositories/customersRepo.ts`
  - `services/repositories/proposalsRepo.ts`
  - `services/repositories/tasksRepo.ts`
  - `services/repositories/auditRepo.ts`

## Schema
- Official schema: `supabase/schema.sql`
- Migration artifact: `supabase/migrations/20260220_000001_core_schema.sql`
- Legacy schema archive: `supabase/legacy/schema_old_pre_hardening.sql`

## Env Checklist
Required for Supabase mode:
```env
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional:
```env
VITE_GEMINI_API_KEY=
VITE_DEBUG_AUTH=false
VITE_SHEETS_API_URL=
```

## QA Checklist
- `npm run dev`
- login
- create customer
- create proposal + add lines
- generate document
- change proposal status
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
