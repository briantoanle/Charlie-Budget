-- Add currency + amount_base for multi-currency support
-- currency: ISO 4217 code of the transaction's native currency
-- amount_base: amount converted to the user's base currency (recalculated on currency change)
alter table "public"."transactions"
  add column "currency"     text    not null default 'USD',
  add column "amount_base"  numeric,
  add column "needs_review" boolean not null default false;

-- needs_review: set true on both a Plaid-synced row and a matching manually-entered row
-- when the sync detects a possible duplicate. User resolves via the UI.
-- See docs/api-routes.md — POST /api/plaid/sync for the dedup logic.

comment on column "public"."transactions"."needs_review" is
  'True when this row is a possible duplicate of another transaction (one manual, one from Plaid). '
  'Both rows are flagged. User resolves by merging, keeping both, or deleting the manual copy.';
