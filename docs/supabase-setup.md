# Supabase Setup Guide

Two modes: **local dev** (default) and **production** (real Supabase project).

---

## Local Dev (Start Here)

Uses a local Supabase Docker instance — no Supabase account needed.

### 1. Prerequisites

```bash
# Docker must be running
docker --version

# Supabase CLI (available via npx, no global install needed)
npx supabase --version
```

### 2. Start local Supabase

```bash
cd /path/to/Charlie
npx supabase start
```

Outputs your local credentials:

```
Project URL:   http://127.0.0.1:54321
Publishable:   sb_publishable_...   ← NEXT_PUBLIC_SUPABASE_ANON_KEY
Secret:        sb_secret_...        ← SUPABASE_SERVICE_ROLE_KEY
DB URL:        postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio:        http://127.0.0.1:54323
```

### 3. Create .env.local

```bash
cp web/.env.local.example web/.env.local
```

Fill it in with the values from `supabase start`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Leave blank until you have Plaid sandbox credentials
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox

# Leave blank until needed
OPENEXCHANGERATES_APP_ID=
```

### 4. Apply migrations + seed data

```bash
# First time (or to reset everything cleanly):
npx supabase db reset

# Subsequent runs — apply only new migrations (preserves data):
npx supabase migration up
```

`db reset` drops and recreates the DB, then runs all migrations and `supabase/seed.sql`.

### 5. Test credentials (from seed.sql)

| Field    | Value              |
|----------|--------------------|
| Email    | `test@charlie.dev` |
| Password | `password123`      |

Log into the app or inspect data at Supabase Studio → `http://127.0.0.1:54323`

### 6. Regenerate TypeScript types after schema changes

```bash
npx supabase gen types typescript --local > web/lib/supabase/database.types.ts
```

Run this every time you add a migration.

### 7. Stop local Supabase

```bash
npx supabase stop
```

---

## Plaid Sandbox (Local Testing)

Sandbox lets you test bank connections without real bank credentials.

### 1. Get Plaid sandbox keys

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com)
2. **Team Settings → Keys** → copy sandbox `client_id` and `secret`

### 2. Add to .env.local

```bash
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

### 3. Sandbox test credentials

When Plaid Link opens in the app:

| Field             | Value       |
|-------------------|-------------|
| Institution       | Any (search "Chase", "Wells Fargo", etc.) |
| Username          | `user_good` |
| Password          | `pass_good` |
| MFA (if prompted) | `1234`      |

Full sandbox credentials: [plaid.com/docs/sandbox/test-credentials](https://plaid.com/docs/sandbox/test-credentials/)

---

## Production Setup (Real Supabase Project)

Do this when you're ready to deploy. **Never run `db reset` against production.**

### 1. Create a Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Set name, password, region — wait ~2 min for provisioning

### 2. Get project credentials

**Project Settings → API:**

```
Project URL:      https://<ref>.supabase.co
Anon key:         eyJ...        ← NEXT_PUBLIC_SUPABASE_ANON_KEY
Service role key: eyJ...        ← SUPABASE_SERVICE_ROLE_KEY (never expose to client)
```

### 3. Link CLI to your project

```bash
# Project ref = the string in your dashboard URL:
# https://supabase.com/dashboard/project/<THIS-PART>

npx supabase link --project-ref <your-project-ref>
```

### 4. Push migrations to production

```bash
npx supabase db push
```

Applies all `supabase/migrations/*.sql` files not yet applied to the remote DB.

### 5. Enable Supabase Vault

Required for encrypting Plaid access tokens:

1. Dashboard → **Database → Vault** → Enable
2. Note the default key name (`default`) — referenced in the Plaid exchange-token route

### 6. Set environment variables

Set these in your hosting provider (Vercel, Railway, etc.) and as Supabase secrets:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
PLAID_CLIENT_ID=<your client_id>
PLAID_SECRET=<production secret>
PLAID_ENV=production
OPENEXCHANGERATES_APP_ID=<your app id>
```

### 7. Deploy the Plaid webhook Edge Function

```bash
# First time only
npx supabase functions new plaid-webhook

# Set secrets for the function
npx supabase secrets set PLAID_CLIENT_ID=xxx PLAID_SECRET=xxx

# Deploy
npx supabase functions deploy plaid-webhook
```

Register this URL in your Plaid dashboard as the webhook endpoint:
`https://<ref>.supabase.co/functions/v1/plaid-webhook`

### 8. Switch Plaid to production

1. Obtain a production `secret` from your Plaid dashboard
2. Submit your Plaid app for production access review (required by Plaid)
3. Set `PLAID_ENV=production` and `PLAID_SECRET=<prod secret>`

---

## Useful Commands

```bash
# View local DB + data in browser
open http://127.0.0.1:54323

# Check which migrations have been applied
npx supabase migration list

# Create a new blank migration file
npx supabase migration new <descriptive-name>

# Generate TypeScript types from local schema
npx supabase gen types typescript --local > web/lib/supabase/database.types.ts

# Tail local Supabase logs
npx supabase logs
```
