# Security Notes

## Secrets and Sensitive Config
- Added `.env`, `.env.*`, and `.env.local` patterns to `.gitignore`.
- Added `.env.example` with placeholders only.
- Removed hardcoded Google Apps Script URL from `config.ts`.
- Script logging (`scripts/supabase-smoke-test-client.ts`) no longer prints partial secret values.

## What Must Stay Out of Git
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_GEMINI_API_KEY`
- Any project-specific Apps Script URL if considered sensitive

## Recommended Key Rotation
If keys were ever committed to git history, rotate:
1. Supabase anon key
2. Supabase service role key
3. Gemini API key
4. Apps Script endpoint tokens/URLs (if access-controlled)

## Runtime Safety
- `VITE_BACKEND_MODE=supabase` now fails clearly when required Supabase env vars are missing.
- Mock mode remains available and isolated from production backend credentials.
