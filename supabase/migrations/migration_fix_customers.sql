-- Patch migration: customers table improvements
-- Safe to run on existing Supabase installations (all statements are idempotent)
-- Run in the Supabase Dashboard > SQL Editor

-- 1. Unique CI email index per org
--    Prevents duplicate emails (case-insensitive) within the same organisation.
--    The core schema may already have this; the IF NOT EXISTS guard makes it safe to re-run.
create unique index if not exists idx_customers_email_unique_ci
  on public.customers (org_id, lower(email))
  where email is not null;

-- 2. Trigger function: normalise fields on insert/update
create or replace function public.set_customers_defaults()
returns trigger language plpgsql as $$
begin
  -- Always lowercase-trim the email so the CI index works consistently
  if new.email is not null then
    new.email := lower(trim(new.email));
  end if;

  -- Ensure is_active is never null
  if new.is_active is null then
    new.is_active := true;
  end if;

  -- Ensure status falls back to a valid value
  if new.status is null then
    new.status := 'Prospect';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_customers_defaults on public.customers;
create trigger trg_set_customers_defaults
  before insert or update on public.customers
  for each row execute function public.set_customers_defaults();

-- 3. RLS policies for customers (explicit per-operation, to authenticated role)
--    Drop the legacy "for all" policy if it exists, then recreate as granular policies.
alter table public.customers enable row level security;

drop policy if exists "customers_modify_org_members" on public.customers;
drop policy if exists "customers_select_org_members" on public.customers;
drop policy if exists "customers_insert_org_members" on public.customers;
drop policy if exists "customers_update_org_members" on public.customers;
drop policy if exists "customers_delete_org_members" on public.customers;

create policy "customers_select_org_members"
  on public.customers for select
  to authenticated
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "customers_insert_org_members"
  on public.customers for insert
  to authenticated
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "customers_update_org_members"
  on public.customers for update
  to authenticated
  using  (org_id = (select org_id from public.profiles where id = auth.uid()))
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "customers_delete_org_members"
  on public.customers for delete
  to authenticated
  using (org_id = (select org_id from public.profiles where id = auth.uid()));
