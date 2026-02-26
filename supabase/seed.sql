-- =============================================================================
-- Local dev seed — test user + sample data
-- Applied automatically by `npx supabase db reset`
-- DO NOT run against production.
-- =============================================================================

-- Create a test user directly in auth.users
-- Email: test@charlie.dev  |  Password: password123
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values (
  '00000000-0000-0000-0000-000000000001',
  'test@charlie.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Test User"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Profile is created automatically by the handle_new_user trigger,
-- but we set base_currency explicitly here
insert into public.profiles (id, display_name, base_currency)
values ('00000000-0000-0000-0000-000000000001', 'Test User', 'USD')
on conflict (id) do update set
  display_name  = excluded.display_name,
  base_currency = excluded.base_currency;

-- Seed categories
insert into public.categories (id, user_id, name, kind, sort_order) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Salary',        'income',   1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Freelance',     'income',   2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Groceries',     'expense',  3),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Dining Out',    'expense',  4),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Transport',     'expense',  5),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Utilities',     'expense',  6),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Rent',          'expense',  7),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Entertainment', 'expense',  8),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Health',        'expense',  9),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Transfer',      'transfer', 10)
on conflict (id) do nothing;

-- Seed manual accounts (no Plaid)
insert into public.accounts (id, user_id, name, type, source, currency, current_balance, balance_as_of) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Main Checking', 'checking', 'manual', 'USD', 4250.00, now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Savings', 'savings', 'manual', 'USD', 12000.00, now()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Visa Credit Card', 'credit', 'manual', 'USD', -840.50, now()
  )
on conflict (id) do nothing;

-- Seed transactions (current month + last month)
insert into public.transactions
  (id, user_id, account_id, category_id, txn_date, amount, currency, amount_base, merchant, note, source)
values
  -- Income this month
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   date_trunc('month', current_date)::date, 5000.00, 'USD', 5000.00, 'ACME Corp', 'Feb salary', 'manual'),

  -- Expenses this month
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007',
   date_trunc('month', current_date)::date + interval '1 day', -1500.00, 'USD', -1500.00, 'Landlord', 'Feb rent', 'manual'),

  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   date_trunc('month', current_date)::date + interval '3 days', -124.30, 'USD', -124.30, 'Whole Foods', null, 'manual'),

  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004',
   date_trunc('month', current_date)::date + interval '5 days', -62.00, 'USD', -62.00, 'Nobu', 'Dinner with client', 'manual'),

  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005',
   date_trunc('month', current_date)::date + interval '6 days', -48.00, 'USD', -48.00, 'Uber', null, 'manual'),

  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006',
   date_trunc('month', current_date)::date + interval '8 days', -95.00, 'USD', -95.00, 'Con Edison', 'Electric bill', 'manual'),

  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   date_trunc('month', current_date)::date + interval '10 days', -87.50, 'USD', -87.50, 'Trader Joe''s', null, 'manual'),

  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008',
   date_trunc('month', current_date)::date + interval '12 days', -14.99, 'USD', -14.99, 'Netflix', null, 'manual'),

  -- Income last month
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   (date_trunc('month', current_date) - interval '1 month')::date, 5000.00, 'USD', 5000.00, 'ACME Corp', 'Jan salary', 'manual'),

  -- Expenses last month
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007',
   (date_trunc('month', current_date) - interval '1 month')::date + interval '1 day', -1500.00, 'USD', -1500.00, 'Landlord', 'Jan rent', 'manual'),

  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   (date_trunc('month', current_date) - interval '1 month')::date + interval '4 days', -210.40, 'USD', -210.40, 'Costco', null, 'manual'),

  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004',
   (date_trunc('month', current_date) - interval '1 month')::date + interval '7 days', -45.00, 'USD', -45.00, 'Sushi Nakazawa', null, 'manual')

on conflict (id) do nothing;

-- Budget for current month
insert into public.budgets (id, user_id, month) values
  ('40000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   date_trunc('month', current_date)::date)
on conflict (id) do nothing;

insert into public.budget_lines (budget_id, category_id, planned_amount) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 400.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 200.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 100.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 150.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 1500.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008',  50.00),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 100.00)
on conflict (budget_id, category_id) do nothing;
