alter table "public"."accounts"
  add column if not exists "persistent_account_id" text,
  add column if not exists "plaid_type" text,
  add column if not exists "plaid_subtype" text;

create unique index if not exists accounts_persistent_account_id_key
  on public.accounts using btree (persistent_account_id)
  where persistent_account_id is not null;
