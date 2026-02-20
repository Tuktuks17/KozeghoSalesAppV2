-- Kozegho Sales App - Official Supabase Schema
-- Source of truth as of 2026-02-20

create extension if not exists "uuid-ossp";

create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id),
  email text,
  full_name text,
  role text not null default 'sales' check (role in ('admin', 'manager', 'sales', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id),
  name text not null,
  contact_name text,
  email text,
  phone text,
  vat_number text,
  address text,
  country text not null default 'Portugal',
  segment text,
  website text,
  company_size text,
  notes text,
  status text not null default 'Prospect' check (status in ('Lead', 'Prospect', 'Active Client', 'Inactive Client')),
  preferred_language text not null default 'English' check (preferred_language in ('Portuguese', 'English', 'Spanish', 'French')),
  market text not null default 'International' check (market in ('National', 'International')),
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_contact_date timestamptz,
  last_proposal_date timestamptz,
  deleted_at timestamptz
);

create table if not exists proposals (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id),
  proposal_number text not null,
  customer_id uuid not null references customers(id),
  status text not null default 'Draft' check (status in ('Draft', 'Pending Approval', 'Approved', 'Sent', 'Won', 'Lost', 'Doc Generated')),
  result text not null default 'Open' check (result in ('Open', 'Won', 'Lost')),
  result_date timestamptz,
  valid_until date,
  currency text not null default 'EUR',
  language text not null default 'English' check (language in ('Portuguese', 'English', 'Spanish', 'French')),
  market text not null default 'International' check (market in ('National', 'International')),
  payment_terms text,
  delivery_terms text,
  delivery_weeks int,
  packaging_type text,
  subject text,
  client_notes text,
  internal_notes text,
  subtotal numeric(12,2) not null default 0,
  discount_global_percent numeric(5,2) not null default 0,
  total numeric(12,2) not null default 0,
  commercial_email text,
  commercial_name text,
  email_sent_at timestamptz,
  doc_url text,
  pdf_url text,
  lost_reason text,
  last_email_to text,
  last_email_cc text,
  last_email_subject text,
  approved_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, proposal_number)
);

create table if not exists proposal_lines (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id),
  proposal_id uuid not null references proposals(id) on delete cascade,
  product_id text,
  product_name text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists proposal_line_options (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id),
  proposal_line_id uuid not null references proposal_lines(id) on delete cascade,
  option_code text not null,
  option_label text not null,
  price_eur numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id),
  title text not null,
  description text,
  is_done boolean not null default false,
  due_date timestamptz,
  customer_id uuid references customers(id),
  proposal_id uuid references proposals(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  org_id uuid not null references organizations(id),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_org_id on customers(org_id);
create index if not exists idx_customers_email on customers(lower(email));
create unique index if not exists idx_customers_email_unique_ci on customers(org_id, lower(email));
create index if not exists idx_proposals_org_id on proposals(org_id);
create index if not exists idx_proposals_customer_id on proposals(customer_id);
create index if not exists idx_proposals_number on proposals(proposal_number);
create index if not exists idx_proposal_lines_proposal_id on proposal_lines(proposal_id);
create index if not exists idx_proposal_line_options_line_id on proposal_line_options(proposal_line_id);
create index if not exists idx_tasks_org_id on tasks(org_id);
create index if not exists idx_tasks_customer_id on tasks(customer_id);
create index if not exists idx_audit_logs_org_created on audit_logs(org_id, created_at desc);

create or replace function current_org_id() returns uuid as $$
  select org_id from profiles where id = auth.uid() limit 1;
$$ language sql security definer;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at
before update on customers
for each row execute function update_updated_at_column();

drop trigger if exists trg_proposals_updated_at on proposals;
create trigger trg_proposals_updated_at
before update on proposals
for each row execute function update_updated_at_column();

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
before update on tasks
for each row execute function update_updated_at_column();

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table proposals enable row level security;
alter table proposal_lines enable row level security;
alter table proposal_line_options enable row level security;
alter table tasks enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
for insert with check (auth.uid() = id);

drop policy if exists "organizations_insert_authenticated" on organizations;
create policy "organizations_insert_authenticated" on organizations
for insert to authenticated with check (true);

drop policy if exists "organizations_select_org_members" on organizations;
create policy "organizations_select_org_members" on organizations
for select using (id = current_org_id());

drop policy if exists "customers_select_org_members" on customers;
create policy "customers_select_org_members" on customers
for select using (org_id = current_org_id());

drop policy if exists "customers_modify_org_members" on customers;
create policy "customers_modify_org_members" on customers
for all using (org_id = current_org_id()) with check (org_id = current_org_id());

drop policy if exists "proposals_select_org_members" on proposals;
create policy "proposals_select_org_members" on proposals
for select using (org_id = current_org_id());

drop policy if exists "proposals_modify_org_members" on proposals;
create policy "proposals_modify_org_members" on proposals
for all using (org_id = current_org_id()) with check (org_id = current_org_id());

drop policy if exists "proposal_lines_select_org_members" on proposal_lines;
create policy "proposal_lines_select_org_members" on proposal_lines
for select using (org_id = current_org_id());

drop policy if exists "proposal_lines_modify_org_members" on proposal_lines;
create policy "proposal_lines_modify_org_members" on proposal_lines
for all using (org_id = current_org_id()) with check (org_id = current_org_id());

drop policy if exists "proposal_line_options_select_org_members" on proposal_line_options;
create policy "proposal_line_options_select_org_members" on proposal_line_options
for select using (org_id = current_org_id());

drop policy if exists "proposal_line_options_modify_org_members" on proposal_line_options;
create policy "proposal_line_options_modify_org_members" on proposal_line_options
for all using (org_id = current_org_id()) with check (org_id = current_org_id());

drop policy if exists "tasks_select_org_members" on tasks;
create policy "tasks_select_org_members" on tasks
for select using (org_id = current_org_id());

drop policy if exists "tasks_modify_org_members" on tasks;
create policy "tasks_modify_org_members" on tasks
for all using (org_id = current_org_id()) with check (org_id = current_org_id());

drop policy if exists "audit_logs_select_org_members" on audit_logs;
create policy "audit_logs_select_org_members" on audit_logs
for select using (org_id = current_org_id());

drop policy if exists "audit_logs_insert_org_members" on audit_logs;
create policy "audit_logs_insert_org_members" on audit_logs
for insert with check (org_id = current_org_id());
