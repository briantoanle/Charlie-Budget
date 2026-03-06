-- Store raw Plaid category on transactions for audit/debugging
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS plaid_category TEXT;

COMMENT ON COLUMN public.transactions.plaid_category IS
  'Raw Plaid personal_finance_category.primary value, stored for audit and re-mapping';
