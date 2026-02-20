# Migration Notes

## Scope
Hardening pass to standardize backend contracts, schema, env handling, and quality tooling.

## 1) Backend Runtime Mode
- Added `VITE_BACKEND_MODE` with supported values:
  - `supabase`
  - `mock`
  - `auto`
- Implemented runtime resolver in `services/runtimeConfig.ts`.
- Updated API facade in `services/api.ts`:
  - controlled mode selection
  - explicit error behavior when `supabase` is forced without env vars.

## 2) Schema Unification
### Official source of truth
- `supabase/schema.sql`

### Migration artifact
- `supabase/migrations/20260220_000001_core_schema.sql`

### Legacy archived
- `supabase/legacy/schema_old_pre_hardening.sql`

### Deprecated file
- `supabase_migration_init.sql` now points to official schema location.

## 3) Tables/Columns Used by Current Repositories
### `services/repositories/customersRepo.ts`
- table: `customers`
- columns: `id`, `org_id`, `name`, `contact_name`, `email`, `phone`, `vat_number`, `address`, `country`, `segment`, `website`, `company_size`, `notes`, `status`, `preferred_language`, `market`, `is_active`, `created_at`, `updated_at`, `last_contact_date`, `last_proposal_date`

### `services/repositories/proposalsRepo.ts`
- table: `proposals`
- columns: `id`, `org_id`, `proposal_number`, `customer_id`, `status`, `result`, `result_date`, `valid_until`, `currency`, `language`, `market`, `payment_terms`, `delivery_terms`, `delivery_weeks`, `packaging_type`, `subject`, `client_notes`, `internal_notes`, `subtotal`, `discount_global_percent`, `total`, `commercial_email`, `commercial_name`, `email_sent_at`, `doc_url`, `pdf_url`, `lost_reason`, `last_email_to`, `last_email_cc`, `last_email_subject`, `approved_at`, `created_at`, `updated_at`, `created_by`, `updated_by`
- table: `proposal_lines`
- columns: `id`, `org_id`, `proposal_id`, `product_id`, `product_name`, `description`, `quantity`, `unit_price`, `discount_percent`, `line_total`, `sort_order`
- table: `proposal_line_options`
- columns: `id`, `org_id`, `proposal_line_id`, `option_code`, `option_label`, `price_eur`

### `services/repositories/tasksRepo.ts`
- table: `tasks`
- columns: `id`, `org_id`, `title`, `description`, `is_done`, `due_date`, `customer_id`, `proposal_id`, `created_by`, `created_at`, `updated_at`

### `services/repositories/auditRepo.ts`
- table: `audit_logs`
- columns: `id`, `org_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`

### Auth/tenant helper tables
- `organizations`: `id`, `name`, `slug`, `owner_id`, `created_at`
- `profiles`: `id`, `org_id`, `email`, `full_name`, `role`, `created_at`, `updated_at`

## 4) Contract Fixes
- `createCliente` now returns created `Cliente` in both backends (`api.supabase.ts` and `api.mock.ts`).
- Proposal route navigation now prefers internal UUID (`internal_id`) where available.
- Proposal saves in Supabase support update path when `internal_id` already exists.
- Fixed `data_validade` mapping to `valid_until`.
- Implemented non-empty `clienteToSheetsRow` in Supabase API.

## 5) Status and Domain Consistency
- Centralized domain normalization in `services/domain.ts`.
- Standardized client status casing (`Active Client`).

## 6) Document and AI Robustness
- Added HTML escaping in `services/documentGenerator.ts`.
- Added resilient GenAI wrapper in `services/genai.ts` with fallback template.

## 7) Quality Tooling Added
- `lint`, `typecheck`, `test` scripts in `package.json`.
- ESLint config (`eslint.config.js`).
- Vitest + RTL setup (`vitest.config.ts`, `test/setup.ts`).
- Minimum test suite:
  - `test/pricing.test.ts`
  - `test/proposalReference.test.ts`
  - `test/runtimeConfig.test.ts`
  - `test/createProposal.test.tsx`
