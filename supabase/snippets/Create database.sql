-- ==============
-- 0) Extensions
-- ==============
create extension if not exists pgcrypto;

-- ==========================
-- 1) Profiles (auth mirror)
-- ==========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ==================
-- 2) Categories
-- ==================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense','transfer')),
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_user_name_uq
on public.categories(user_id, lower(name));

alter table public.categories enable row level security;

create policy "categories_crud_own"
on public.categories
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ==================
-- 3) Accounts
-- ==================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null, -- e.g. checking/savings/credit/cash
  source text not null check (source in ('manual','plaid')),
  plaid_account_id text unique, -- nullable
  currency text not null default 'USD',
  current_balance numeric, -- optional snapshot
  balance_as_of timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

alter table public.accounts enable row level security;

create policy "accounts_crud_own"
on public.accounts
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ==================
-- 4) Transactions
-- ==================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  txn_date date not null,
  amount numeric not null,
  merchant text,
  note text,
  source text not null check (source in ('manual','plaid')),
  plaid_transaction_id text unique, -- nullable
  pending boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
on public.transactions(user_id, txn_date desc);

create index if not exists transactions_account_date_idx
on public.transactions(account_id, txn_date desc);

alter table public.transactions enable row level security;

create policy "transactions_crud_own"
on public.transactions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ==================
-- 5) Budgets + lines
-- ==================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- use first-of-month (e.g. 2026-02-01)
  created_at timestamptz not null default now()
);

create unique index if not exists budgets_user_month_uq
on public.budgets(user_id, month);

alter table public.budgets enable row level security;

create policy "budgets_crud_own"
on public.budgets
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  planned_amount numeric not null,
  created_at timestamptz not null default now()
);

create unique index if not exists budget_lines_budget_category_uq
on public.budget_lines(budget_id, category_id);

alter table public.budget_lines enable row level security;

-- RLS: budget_lines belongs to the user via budgets.user_id
create policy "budget_lines_select_own"
on public.budget_lines for select
using (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_lines.budget_id
      and b.user_id = auth.uid()
  )
);

create policy "budget_lines_insert_own"
on public.budget_lines for insert
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_lines.budget_id
      and b.user_id = auth.uid()
  )
);

create policy "budget_lines_update_own"
on public.budget_lines for update
using (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_lines.budget_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_lines.budget_id
      and b.user_id = auth.uid()
  )
);

create policy "budget_lines_delete_own"
on public.budget_lines for delete
using (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_lines.budget_id
      and b.user_id = auth.uid()
  )
);