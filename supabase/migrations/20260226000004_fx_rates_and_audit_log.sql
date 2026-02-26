-- FX rate cache keyed by date
-- rates: JSON object of { "EUR": 0.92, "GBP": 0.79, ... } — all relative to USD
-- Avoids repeated calls to Open Exchange Rates for the same date
create table "public"."fx_rates" (
  "date"       date        not null,
  "rates"      jsonb       not null,
  "fetched_at" timestamp with time zone not null default now(),
  constraint "fx_rates_pkey" primary key ("date")
);

-- No RLS needed — fx_rates is not user-scoped (shared cache)
-- service_role handles writes; authenticated role only reads
grant select on table "public"."fx_rates" to authenticated;
grant select, insert, update, delete on table "public"."fx_rates" to service_role;


-- Audit log — append-only record of sensitive mutations
-- Written server-side (service_role); users can read their own rows only
create table "public"."audit_log" (
  "id"         uuid        not null default gen_random_uuid(),
  "user_id"    uuid        not null,
  "action"     text        not null,  -- e.g. 'plaid_item.linked', 'account.deleted'
  "table_name" text,
  "record_id"  uuid,
  "diff"       jsonb,
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."audit_log" enable row level security;

create unique index audit_log_pkey       on public.audit_log using btree (id);
create        index audit_log_user_idx   on public.audit_log using btree (user_id);
create        index audit_log_created_idx on public.audit_log using btree (created_at desc);

alter table "public"."audit_log"
  add constraint "audit_log_pkey" primary key using index "audit_log_pkey";

alter table "public"."audit_log"
  add constraint "audit_log_user_id_fkey"
  foreign key (user_id) references auth.users(id) on delete cascade not valid;

alter table "public"."audit_log" validate constraint "audit_log_user_id_fkey";

create policy "audit_log_select_own"
  on "public"."audit_log" as permissive for select to public
  using (user_id = auth.uid());

-- No insert/update/delete policies for authenticated — only service_role writes
grant select on table "public"."audit_log" to authenticated;
grant select, insert on table "public"."audit_log" to service_role;
