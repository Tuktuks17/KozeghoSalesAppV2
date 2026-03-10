-- Migration: proposals table (simplified schema for fresh installations)
-- NOTE: The full app schema already defines a richer proposals table in
--       20260220_000001_core_schema.sql.  Run THIS file only if you are
--       setting up a greenfield Supabase project that does NOT yet have
--       the core schema applied.  The CREATE TABLE is guarded with
--       IF NOT EXISTS so it is safe to run against an existing database —
--       it will simply be a no-op for the table while still applying
--       the RLS policies and trigger below.
-- Run in: Supabase Dashboard > SQL Editor

-- Tabela proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  total_value numeric(12,2),
  pdf_url text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.proposals enable row level security;

-- SELECT: todos da mesma org
drop policy if exists "proposals_select_org" on public.proposals;
create policy "proposals_select_org"
  on public.proposals for select
  to authenticated
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

-- INSERT: só sales/manager/admin, created_by = próprio
drop policy if exists "proposals_insert_sales" on public.proposals;
create policy "proposals_insert_sales"
  on public.proposals for insert
  to authenticated
  with check (
    org_id = (select org_id from public.profiles where id = auth.uid())
    and created_by = auth.uid()
    and (select role from public.profiles where id = auth.uid()) in ('sales', 'manager', 'admin')
  );

-- UPDATE: dono em draft OU manager/admin
drop policy if exists "proposals_update_owner_or_manager" on public.proposals;
create policy "proposals_update_owner_or_manager"
  on public.proposals for update
  to authenticated
  using (
    org_id = (select org_id from public.profiles where id = auth.uid())
    and (
      (created_by = auth.uid() and status = 'draft')
      or (select role from public.profiles where id = auth.uid()) in ('manager', 'admin')
    )
  );

-- DELETE: dono em draft OU manager/admin
drop policy if exists "proposals_delete_owner_or_manager" on public.proposals;
create policy "proposals_delete_owner_or_manager"
  on public.proposals for delete
  to authenticated
  using (
    org_id = (select org_id from public.profiles where id = auth.uid())
    and (
      (created_by = auth.uid() and status = 'draft')
      or (select role from public.profiles where id = auth.uid()) in ('manager', 'admin')
    )
  );

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_proposals_updated_at on public.proposals;
create trigger trg_proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();
