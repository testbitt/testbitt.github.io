-- YOTHE Inventory Stock Checker - Supabase Free schema scaffold
-- Independent from KAMU. Run only in a dedicated YOTHE Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  branch_code text not null,
  branch_name text,
  created_at timestamptz not null default now(),
  unique(owner_id, branch_code)
);

create table if not exists public.stock_movement (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_code text,
  stock_date date,
  rm_code text,
  description text,
  unit text,
  quantity numeric,
  source_file text,
  imported_at timestamptz not null default now()
);
create index if not exists idx_stock_movement_owner_date on public.stock_movement(owner_id, stock_date);
create index if not exists idx_stock_movement_owner_rm on public.stock_movement(owner_id, rm_code);

create table if not exists public.item_sale (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_code text,
  sale_date date,
  item_code text,
  item_name text,
  quantity numeric,
  amount numeric,
  source_file text,
  imported_at timestamptz not null default now()
);
create index if not exists idx_item_sale_owner_date on public.item_sale(owner_id, sale_date);
create index if not exists idx_item_sale_owner_item on public.item_sale(owner_id, item_code);

create table if not exists public.bom (
  id uuid primary key default gen_random_uuid(),
  item_code text not null,
  rm_code text not null,
  qty_per numeric,
  unit text,
  version text,
  modified_date timestamptz,
  parent_wip_code text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_bom_item on public.bom(item_code);
create index if not exists idx_bom_rm on public.bom(rm_code);

create table if not exists public.unit_conversion (
  id uuid primary key default gen_random_uuid(),
  rm_code text not null,
  from_unit text not null,
  to_unit text not null,
  factor numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(rm_code, from_unit, to_unit)
);

create table if not exists public.item_mapping (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  product_name text,
  cup_type text,
  rm_code text,
  count_as_cup boolean not null default false,
  usage_source text check (usage_source in ('BOM','Stock Movement','Item Sale')),
  version text,
  modified_date timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  global_usage_source text not null default 'BOM'
    check (global_usage_source in ('BOM','Stock Movement','Item Sale')),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_check_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create table if not exists public.custom_check_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custom_check_groups(id) on delete cascade,
  rm_code text not null,
  created_at timestamptz not null default now(),
  unique(group_id, rm_code)
);

create table if not exists public.audit_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_code text,
  stock_date date,
  custom_check_name text,
  inspector text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.count_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_code text not null,
  stock_date date not null,
  rm_code text not null,
  actual_count numeric,
  note text,
  inspector text,
  updated_at timestamptz not null default now(),
  unique(owner_id, branch_code, stock_date, rm_code)
);

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.stock_movement enable row level security;
alter table public.item_sale enable row level security;
alter table public.custom_check_groups enable row level security;
alter table public.custom_check_items enable row level security;
alter table public.audit_history enable row level security;
alter table public.count_results enable row level security;
alter table public.user_settings enable row level security;

create policy if not exists "profiles own row" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "branches own rows" on public.branches
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "stock own rows" on public.stock_movement
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "itemsale own rows" on public.item_sale
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "groups own rows" on public.custom_check_groups
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "group items owner access" on public.custom_check_items
for all using (
  exists(select 1 from public.custom_check_groups g where g.id = group_id and g.owner_id = auth.uid())
) with check (
  exists(select 1 from public.custom_check_groups g where g.id = group_id and g.owner_id = auth.uid())
);

create policy if not exists "history own rows" on public.audit_history
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "count own rows" on public.count_results
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "settings own row" on public.user_settings
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Global masters (BOM, unit_conversion, item_mapping) intentionally have no public write policy here.
-- Add admin-only policies after the dedicated YOTHE Admin role/service design is finalized.
