-- ==========================================
-- Seed data for user: test@test.com
-- ==========================================

do $$
declare
  v_user_id uuid;
  v_checking_id uuid;
  v_credit_id uuid;
  v_feb_budget_id uuid;
begin

  -- ----------------------------------------
  -- 1) Get user ID
  -- ----------------------------------------
  select id into v_user_id
  from auth.users
  where email = 'test@test.com';

  if v_user_id is null then
    raise exception 'User test@test.com does not exist';
  end if;

  -- ----------------------------------------
  -- 2) Insert Categories
  -- ----------------------------------------
  insert into public.categories (user_id, name, kind, sort_order)
  values
    (v_user_id, 'Salary', 'income', 1),
    (v_user_id, 'Food', 'expense', 2),
    (v_user_id, 'Rent', 'expense', 3),
    (v_user_id, 'Transportation', 'expense', 4),
    (v_user_id, 'Entertainment', 'expense', 5),
    (v_user_id, 'Savings', 'transfer', 6)
  on conflict do nothing;

  -- ----------------------------------------
  -- 3) Insert Accounts
  -- ----------------------------------------
  insert into public.accounts (user_id, name, type, source, currency, current_balance, balance_as_of)
  values
    (v_user_id, 'Main Checking', 'checking', 'manual', 'USD', 8500, now()),
    (v_user_id, 'Chase Credit Card', 'credit', 'manual', 'USD', -1200, now())
  on conflict do nothing;

  -- Get account IDs
  select id into v_checking_id
  from public.accounts
  where user_id = v_user_id and name = 'Main Checking'
  limit 1;

  select id into v_credit_id
  from public.accounts
  where user_id = v_user_id and name = 'Chase Credit Card'
  limit 1;

-- ----------------------------------------
-- 4) Insert Transactions (Jan + Feb 2026)
-- ----------------------------------------
insert into public.transactions
  (user_id, account_id, category_id, txn_date, amount, merchant, source)
select
  v_user_id,
  v_checking_id,
  c.id,
  t.txn_date,
  t.amount,
  t.merchant,
  'manual'
from (
  values
    ('2026-01-01'::date,  5000, 'Salary',        'ACME Corp Payroll'),
    ('2026-01-03'::date, -1800, 'Rent',          'Landlord LLC'),
    ('2026-01-05'::date, -120,  'Food',          'Trader Joe''s'),
    ('2026-01-10'::date, -75,   'Transportation','Uber'),
    ('2026-01-15'::date, -200,  'Entertainment', 'AMC Theatres'),
    ('2026-02-01'::date,  5000, 'Salary',        'ACME Corp Payroll'),
    ('2026-02-03'::date, -1800, 'Rent',          'Landlord LLC'),
    ('2026-02-06'::date, -150,  'Food',          'Whole Foods'),
    ('2026-02-12'::date, -60,   'Transportation','Gas Station'),
    ('2026-02-18'::date, -250,  'Entertainment', 'Steam Store')
) as t(txn_date, amount, category_name, merchant)
join public.categories c
  on c.user_id = v_user_id
 and c.name = t.category_name
on conflict do nothing;


-- Credit card transactions
insert into public.transactions
  (user_id, account_id, category_id, txn_date, amount, merchant, source)
select
  v_user_id,
  v_credit_id,
  c.id,
  t.txn_date,
  t.amount,
  t.merchant,
  'manual'
from (
  values
    ('2026-02-07'::date, -90,  'Food',         'Chipotle'),
    ('2026-02-14'::date, -140, 'Entertainment','Concert Tickets')
) as t(txn_date, amount, category_name, merchant)
join public.categories c
  on c.user_id = v_user_id
 and c.name = t.category_name
on conflict do nothing;
  -- ----------------------------------------
  -- 5) Create February Budget
  -- ----------------------------------------
  insert into public.budgets (user_id, month)
  values (v_user_id, '2026-02-01')
  on conflict (user_id, month) do nothing;

  select id into v_feb_budget_id
  from public.budgets
  where user_id = v_user_id
    and month = '2026-02-01'
  limit 1;

  -- ----------------------------------------
  -- 6) Budget Lines
  -- ----------------------------------------
  insert into public.budget_lines (budget_id, category_id, planned_amount)
  select
    v_feb_budget_id,
    c.id,
    b.planned
  from (
    values
      ('Food', 500),
      ('Rent', 1800),
      ('Transportation', 200),
      ('Entertainment', 400)
  ) as b(category_name, planned)
  join public.categories c
    on c.user_id = v_user_id
   and c.name = b.category_name
  on conflict do nothing;

end $$;