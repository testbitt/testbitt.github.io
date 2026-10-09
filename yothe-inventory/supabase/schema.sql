-- Yothe-only schema: execute only in a NEW dedicated Supabase project, NEVER in KAMU.
create table if not exists public.yothe_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'user' check (role in ('admin','user')),
 created_at timestamptz not null default now()
);
create table if not exists public.yothe_imports (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 data_type text not null check (data_type in ('stock_movement','item_sales')),
 filename text not null,
 uploaded_at timestamptz not null default now(),
 row_count integer not null default 0
);
create table if not exists public.yothe_rows (
 id bigint generated always as identity primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 import_id uuid not null references public.yothe_imports(id) on delete cascade,
 data_type text not null check (data_type in ('stock_movement','item_sales')),
 row_index integer not null,
 payload jsonb not null,
 unique (import_id,row_index)
);
create index if not exists yothe_rows_owner_type_idx on public.yothe_rows(owner_id,data_type);
create table if not exists public.yothe_master (
 id bigint generated always as identity primary key,
 data_type text not null check (data_type in ('bom','wip','unit_conversion','item_mapping')),
 row_index integer not null,
 payload jsonb not null,
 modified_at timestamptz not null default now()
);
create table if not exists public.yothe_settings (
 name text primary key,
 value jsonb not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.yothe_counts (
 id bigint generated always as identity primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 branch_code text not null,
 item_code text not null,
 count_date date not null,
 actual_quantity numeric not null,
 notes text,
 created_at timestamptz not null default now()
);
create index if not exists yothe_counts_owner_branch_idx on public.yothe_counts(owner_id,branch_code,count_date);
create function public.yothe_is_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$select exists (select 1 from public.yothe_members where user_id=(select auth.uid()) and role='admin')$$;
revoke all on function public.yothe_is_admin() from public;
grant execute on function public.yothe_is_admin() to authenticated;
alter table public.yothe_members enable row level security;
alter table public.yothe_imports enable row level security;
alter table public.yothe_rows enable row level security;
alter table public.yothe_master enable row level security;
alter table public.yothe_settings enable row level security;
alter table public.yothe_counts enable row level security;
create policy "own member read" on public.yothe_members for select to authenticated using (user_id=(select auth.uid()));
create policy "read own imports" on public.yothe_imports for select to authenticated using (owner_id=(select auth.uid()));
create policy "insert own imports" on public.yothe_imports for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "delete own imports" on public.yothe_imports for delete to authenticated using (owner_id=(select auth.uid()));
create policy "read own rows" on public.yothe_rows for select to authenticated using (owner_id=(select auth.uid()));
create policy "insert own rows" on public.yothe_rows for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.yothe_imports i where i.id=import_id and i.owner_id=(select auth.uid()) and i.data_type=yothe_rows.data_type));
create policy "delete own rows" on public.yothe_rows for delete to authenticated using (owner_id=(select auth.uid()));
create policy "read master" on public.yothe_master for select to authenticated using (true);
create policy "admin insert master" on public.yothe_master for insert to authenticated with check (public.yothe_is_admin());
create policy "admin update master" on public.yothe_master for update to authenticated using (public.yothe_is_admin()) with check (public.yothe_is_admin());
create policy "admin delete master" on public.yothe_master for delete to authenticated using (public.yothe_is_admin());
create policy "read settings" on public.yothe_settings for select to authenticated using (true);
create policy "admin insert settings" on public.yothe_settings for insert to authenticated with check (public.yothe_is_admin());
create policy "admin update settings" on public.yothe_settings for update to authenticated using (public.yothe_is_admin()) with check (public.yothe_is_admin());
create policy "read own counts" on public.yothe_counts for select to authenticated using (owner_id=(select auth.uid()));
create policy "insert own counts" on public.yothe_counts for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "update own counts" on public.yothe_counts for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "delete own counts" on public.yothe_counts for delete to authenticated using (owner_id=(select auth.uid()));
-- Admin enrollment is NEVER exposed to clients. After the first admin registers,
-- the DB owner must insert their UUID manually into yothe_members.
