-- Plaid items (one per institution connection)
-- access_token is encrypted at rest via Supabase Vault before storage
create table "public"."plaid_items" (
  "id"               uuid        not null default gen_random_uuid(),
  "user_id"          uuid        not null,
  "institution_id"   text        not null,
  "institution_name" text        not null,
  "access_token_enc" text        not null,
  "item_id"          text        not null,
  "cursor"           text,
  "needs_reauth"     boolean     not null default false,
  "last_synced_at"   timestamp with time zone,
  "created_at"       timestamp with time zone not null default now()
);

alter table "public"."plaid_items" enable row level security;

create unique index plaid_items_pkey         on public.plaid_items using btree (id);
create unique index plaid_items_item_id_key  on public.plaid_items using btree (item_id);
create        index plaid_items_user_id_idx  on public.plaid_items using btree (user_id);

alter table "public"."plaid_items"
  add constraint "plaid_items_pkey" primary key using index "plaid_items_pkey";

alter table "public"."plaid_items"
  add constraint "plaid_items_item_id_key" unique using index "plaid_items_item_id_key";

alter table "public"."plaid_items"
  add constraint "plaid_items_user_id_fkey"
  foreign key (user_id) references auth.users(id) on delete cascade not valid;

alter table "public"."plaid_items" validate constraint "plaid_items_user_id_fkey";

-- RLS: users can only see their own plaid items
create policy "plaid_items_select_own"
  on "public"."plaid_items" as permissive for select to public
  using (user_id = auth.uid());

create policy "plaid_items_insert_own"
  on "public"."plaid_items" as permissive for insert to public
  with check (user_id = auth.uid());

create policy "plaid_items_update_own"
  on "public"."plaid_items" as permissive for update to public
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "plaid_items_delete_own"
  on "public"."plaid_items" as permissive for delete to public
  using (user_id = auth.uid());

-- Grants
grant select, insert, update, delete on table "public"."plaid_items" to authenticated;
grant select, insert, update, delete on table "public"."plaid_items" to service_role;

-- Add plaid_item_id FK to accounts (null for manually-created accounts)
alter table "public"."accounts"
  add column "plaid_item_id" uuid references public.plaid_items(id) on delete set null;

create index accounts_plaid_item_id_idx on public.accounts using btree (plaid_item_id);
