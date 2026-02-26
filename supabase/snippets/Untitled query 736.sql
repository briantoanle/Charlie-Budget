-- Read all transactions in February 2026 for the *current authenticated user*
-- Notes:
--   - date_trunc('month', ...) gives us the month boundary
--   - we filter by [start_of_month, start_of_next_month) so it works for all months
--   - join to accounts to ensure we only pull transactions from accounts owned by the user
select
  t.id,                           -- transaction primary key
  t.txn_date,                     -- date of the transaction
  t.amount,                       -- signed amount (you decide convention: -expense, +income)
  t.category_id,                  -- category label (nullable depending on your schema)
  t.account_id                    -- which account this transaction belongs to
from transactions t
join accounts a
  on a.id = t.account_id          -- connect each transaction to its owning account
where a.user_id = auth.uid()      -- only return rows owned by the current user (RLS should also enforce this)
  and t.txn_date >= date '2026-02-01'     -- inclusive start of month
  and t.txn_date <  date '2026-03-01'     -- exclusive start of next month
order by t.txn_date desc, t.id desc;      -- newest first, stable tie-breaker