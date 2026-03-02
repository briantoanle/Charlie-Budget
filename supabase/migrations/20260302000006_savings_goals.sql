-- Create savings_goals table
create table "public"."savings_goals" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "name" text not null,
  "target_amount" numeric not null,
  "current_amount" numeric not null default 0,
  "currency" text not null default 'USD'::text,
  "target_date" date,
  "color" text,
  "emoji" text,
  "archived" boolean not null default false,
  "created_at" timestamp with time zone not null default now()
);

-- Enable RLS
alter table "public"."savings_goals" enable row level security;

-- Add constraints
alter table "public"."savings_goals" add constraint "savings_goals_pkey" PRIMARY KEY ("id");
alter table "public"."savings_goals" add constraint "savings_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create policies
create policy "savings_goals_crud_own"
on "public"."savings_goals"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));

-- Add to audit log if needed (skipping for now as it's a new feature)
