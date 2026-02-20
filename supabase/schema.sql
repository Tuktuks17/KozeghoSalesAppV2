-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: clients
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  
  -- Core Fields
  company_name text not null,
  contact_name text,
  nif text,
  email text,
  phone text,
  
  -- Address
  billing_address text,
  delivery_address text,
  country text default 'Portugal',
  
  -- Business Logic
  industry text,
  status text default 'Lead', -- Lead, Prospect, Active Client, Inactive Client
  preferred_language text default 'Portuguese',
  market text default 'National',
  
  -- Metadata
  website text,
  company_size text,
  notes text,
  is_active boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_contact_date timestamp with time zone
);

-- Table: products (Catalog)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  name text not null,
  description text,
  category text, -- Family
  base_price numeric(10,2) not null,
  currency text default 'EUR',
  is_active boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: proposals
create table public.proposals (
  id uuid default uuid_generate_v4() primary key,
  public_id text not null, -- Human readable ID e.g. 1122BMK/25
  internal_id uuid default uuid_generate_v4(),
  
  owner_id uuid references public.profiles(id) not null,
  client_id uuid references public.clients(id) not null,
  
  subject text,
  status text default 'Draft', -- Draft, Sent, Won, Lost
  result text default 'Open',
  
  -- Dates
  valid_until date,
  sent_date timestamp with time zone,
  result_date timestamp with time zone,
  
  -- Financials
  currency text default 'EUR',
  subtotal numeric(10,2) default 0,
  tax_percent numeric(5,2) default 23,
  tax_value numeric(10,2) default 0,
  total numeric(10,2) default 0,
  discount_percent numeric(5,2) default 0,
  
  -- Terms
  payment_terms text,
  delivery_terms text,
  delivery_weeks integer,
  
  -- Notes
  internal_notes text,
  customer_notes text,
  
  -- Documents
  doc_url text,
  pdf_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: proposal_items
create table public.proposal_items (
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  
  product_id text, -- Can be linked to products table or free text if product is custom
  product_name text not null,
  description text,
  quantity numeric(10,2) default 1,
  unit_price numeric(10,2) default 0,
  discount_percent numeric(5,2) default 0,
  line_total numeric(10,2) default 0,
  
  -- Config details
  configuration_json jsonb, -- Selected options
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: timeline_events (Audit/Activity)
create table public.timeline_events (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  user_id uuid references public.profiles(id),
  
  type text not null, -- note_added, status_change, etc.
  description text,
  metadata jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES

-- Profiles: Public read (for names), self update
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- Clients: Owner only (or Team later)
alter table public.clients enable row level security;
create policy "Users can view own clients." on public.clients for select using ( auth.uid() = owner_id );
create policy "Users can insert own clients." on public.clients for insert with check ( auth.uid() = owner_id );
create policy "Users can update own clients." on public.clients for update using ( auth.uid() = owner_id );

-- Proposals: Owner only
alter table public.proposals enable row level security;
create policy "Users can view own proposals." on public.proposals for select using ( auth.uid() = owner_id );
create policy "Users can insert own proposals." on public.proposals for insert with check ( auth.uid() = owner_id );
create policy "Users can update own proposals." on public.proposals for update using ( auth.uid() = owner_id );

-- Items: Inherit from Proposal
alter table public.proposal_items enable row level security;
create policy "Users can view items of own proposals." on public.proposal_items for select using ( exists ( select 1 from public.proposals where id = proposal_items.proposal_id and owner_id = auth.uid() ) );
create policy "Users can insert items to own proposals." on public.proposal_items for insert with check ( exists ( select 1 from public.proposals where id = proposal_items.proposal_id and owner_id = auth.uid() ) );
create policy "Users can update items of own proposals." on public.proposal_items for update using ( exists ( select 1 from public.proposals where id = proposal_items.proposal_id and owner_id = auth.uid() ) );

-- Timeline: Owner only (via User or Client)
alter table public.timeline_events enable row level security;
create policy "Users can view events they created or related to their clients." on public.timeline_events for select using ( auth.uid() = user_id or exists (select 1 from public.clients where id = timeline_events.client_id and owner_id = auth.uid()) );
create policy "Users can insert events." on public.timeline_events for insert with check ( auth.uid() = user_id );

-- Storage Buckets Configuration (Pseudo-code, must be set in Supabase UI)
-- Bucket: 'proposals' (Private, authenticated only)
