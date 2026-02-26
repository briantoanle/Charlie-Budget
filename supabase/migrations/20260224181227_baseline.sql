
  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "source" text not null,
    "plaid_account_id" text,
    "currency" text not null default 'USD'::text,
    "current_balance" numeric,
    "balance_as_of" timestamp with time zone,
    "archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."accounts" enable row level security;


  create table "public"."budget_lines" (
    "id" uuid not null default gen_random_uuid(),
    "budget_id" uuid not null,
    "category_id" uuid not null,
    "planned_amount" numeric not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."budget_lines" enable row level security;


  create table "public"."budgets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "month" date not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."budgets" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "kind" text not null,
    "sort_order" integer not null default 0,
    "archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "display_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "account_id" uuid not null,
    "category_id" uuid,
    "txn_date" date not null,
    "amount" numeric not null,
    "merchant" text,
    "note" text,
    "source" text not null,
    "plaid_transaction_id" text,
    "pending" boolean not null default false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transactions" enable row level security;

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX accounts_plaid_account_id_key ON public.accounts USING btree (plaid_account_id);

CREATE INDEX accounts_user_id_idx ON public.accounts USING btree (user_id);

CREATE UNIQUE INDEX budget_lines_budget_category_uq ON public.budget_lines USING btree (budget_id, category_id);

CREATE UNIQUE INDEX budget_lines_pkey ON public.budget_lines USING btree (id);

CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id);

CREATE UNIQUE INDEX budgets_user_month_uq ON public.budgets USING btree (user_id, month);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_user_name_uq ON public.categories USING btree (user_id, lower(name));

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX transactions_account_date_idx ON public.transactions USING btree (account_id, txn_date DESC);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX transactions_plaid_transaction_id_key ON public.transactions USING btree (plaid_transaction_id);

CREATE INDEX transactions_user_date_idx ON public.transactions USING btree (user_id, txn_date DESC);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."budget_lines" add constraint "budget_lines_pkey" PRIMARY KEY using index "budget_lines_pkey";

alter table "public"."budgets" add constraint "budgets_pkey" PRIMARY KEY using index "budgets_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."accounts" add constraint "accounts_plaid_account_id_key" UNIQUE using index "accounts_plaid_account_id_key";

alter table "public"."accounts" add constraint "accounts_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'plaid'::text]))) not valid;

alter table "public"."accounts" validate constraint "accounts_source_check";

alter table "public"."accounts" add constraint "accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_user_id_fkey";

alter table "public"."budget_lines" add constraint "budget_lines_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE not valid;

alter table "public"."budget_lines" validate constraint "budget_lines_budget_id_fkey";

alter table "public"."budget_lines" add constraint "budget_lines_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT not valid;

alter table "public"."budget_lines" validate constraint "budget_lines_category_id_fkey";

alter table "public"."budgets" add constraint "budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_user_id_fkey";

alter table "public"."categories" add constraint "categories_kind_check" CHECK ((kind = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text]))) not valid;

alter table "public"."categories" validate constraint "categories_kind_check";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_account_id_fkey";

alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_category_id_fkey";

alter table "public"."transactions" add constraint "transactions_plaid_transaction_id_key" UNIQUE using index "transactions_plaid_transaction_id_key";

alter table "public"."transactions" add constraint "transactions_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'plaid'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_source_check";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$function$
;

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."budget_lines" to "anon";

grant insert on table "public"."budget_lines" to "anon";

grant references on table "public"."budget_lines" to "anon";

grant select on table "public"."budget_lines" to "anon";

grant trigger on table "public"."budget_lines" to "anon";

grant truncate on table "public"."budget_lines" to "anon";

grant update on table "public"."budget_lines" to "anon";

grant delete on table "public"."budget_lines" to "authenticated";

grant insert on table "public"."budget_lines" to "authenticated";

grant references on table "public"."budget_lines" to "authenticated";

grant select on table "public"."budget_lines" to "authenticated";

grant trigger on table "public"."budget_lines" to "authenticated";

grant truncate on table "public"."budget_lines" to "authenticated";

grant update on table "public"."budget_lines" to "authenticated";

grant delete on table "public"."budget_lines" to "service_role";

grant insert on table "public"."budget_lines" to "service_role";

grant references on table "public"."budget_lines" to "service_role";

grant select on table "public"."budget_lines" to "service_role";

grant trigger on table "public"."budget_lines" to "service_role";

grant truncate on table "public"."budget_lines" to "service_role";

grant update on table "public"."budget_lines" to "service_role";

grant delete on table "public"."budgets" to "anon";

grant insert on table "public"."budgets" to "anon";

grant references on table "public"."budgets" to "anon";

grant select on table "public"."budgets" to "anon";

grant trigger on table "public"."budgets" to "anon";

grant truncate on table "public"."budgets" to "anon";

grant update on table "public"."budgets" to "anon";

grant delete on table "public"."budgets" to "authenticated";

grant insert on table "public"."budgets" to "authenticated";

grant references on table "public"."budgets" to "authenticated";

grant select on table "public"."budgets" to "authenticated";

grant trigger on table "public"."budgets" to "authenticated";

grant truncate on table "public"."budgets" to "authenticated";

grant update on table "public"."budgets" to "authenticated";

grant delete on table "public"."budgets" to "service_role";

grant insert on table "public"."budgets" to "service_role";

grant references on table "public"."budgets" to "service_role";

grant select on table "public"."budgets" to "service_role";

grant trigger on table "public"."budgets" to "service_role";

grant truncate on table "public"."budgets" to "service_role";

grant update on table "public"."budgets" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";


  create policy "accounts_crud_own"
  on "public"."accounts"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "budget_lines_delete_own"
  on "public"."budget_lines"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.budgets b
  WHERE ((b.id = budget_lines.budget_id) AND (b.user_id = auth.uid())))));



  create policy "budget_lines_insert_own"
  on "public"."budget_lines"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.budgets b
  WHERE ((b.id = budget_lines.budget_id) AND (b.user_id = auth.uid())))));



  create policy "budget_lines_select_own"
  on "public"."budget_lines"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.budgets b
  WHERE ((b.id = budget_lines.budget_id) AND (b.user_id = auth.uid())))));



  create policy "budget_lines_update_own"
  on "public"."budget_lines"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.budgets b
  WHERE ((b.id = budget_lines.budget_id) AND (b.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.budgets b
  WHERE ((b.id = budget_lines.budget_id) AND (b.user_id = auth.uid())))));



  create policy "budgets_crud_own"
  on "public"."budgets"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "categories_crud_own"
  on "public"."categories"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "transactions_crud_own"
  on "public"."transactions"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


