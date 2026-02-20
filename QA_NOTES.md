# QA Notes

## Run 1 — MOCK mode
- Date: 2026-02-20T11:46:01.861Z
- Mode: `VITE_BACKEND_MODE=mock`
- Base URL: `http://127.0.0.1:4173`

### Results
- PASS: AUTH login and redirect to dashboard.
- PASS: Create client in `/clients/new` and navigate to `/client/:id`.
- PASS: Create proposal in `/create` with configurable line and redirect to `/proposal/:id/document`.
- PASS: Document page opens and AI email fallback is generated without API key.
- FAIL: No status transition controls shown for proposal state `Draft/Doc Generated`, so 2–3 status changes cannot be performed from UI in this path.

### Issues Found
- Pipeline status transition UI is not available for `Draft/Doc Generated` proposals in `/proposal/:id`.

## Run 2 — SUPABASE mode
- Date: 2026-02-20T11:47:09.325Z
- Mode: `VITE_BACKEND_MODE=supabase`
- Base URL: `http://127.0.0.1:4173`

### Results
- FAIL: Automated signup flow did not reach dashboard and did not show a deterministic confirmation screen usable for continuation.

### Issues Found
- Supabase auth path is currently blocked for end-to-end automated happy-path QA without a known-valid test account/session.

## Artifacts
- Browser QA scripts used:
  - `scripts/ui-qa-mock.mjs`
  - `scripts/ui-qa-supabase.mjs`
- Detailed supabase run notes: `QA_SUPABASE_NOTES.md`
