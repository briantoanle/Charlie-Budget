# Charlie Budget App — Routing & Architecture Reference

> Generated: 2026-03-02

---

## Table of Contents

1. [File / Folder Structure](#1-file--folder-structure)
2. [Frontend Page Routes](#2-frontend-page-routes)
3. [API Routes — Detailed](#3-api-routes--detailed)
4. [Database Schema](#4-database-schema)
5. [Frontend Data Fetching](#5-frontend-data-fetching)
6. [Shared Utilities](#6-shared-utilities)
7. [Bugs, Missing Implementations & Inconsistencies](#7-bugs-missing-implementations--inconsistencies)
8. [Quick-Reference API Table](#8-quick-reference-api-table)

---

## 1. File / Folder Structure

```
Charlie/
├── web/
│   ├── app/
│   │   ├── (app)/                  # Protected routes (auth group layout)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── accounts/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── investments/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── (auth)/                 # Public auth routes
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── api/                    # Backend API routes
│   │   │   ├── accounts/
│   │   │   ├── categories/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── settings/
│   │   │   ├── plaid/
│   │   │   ├── reports/
│   │   │   └── investments/
│   │   ├── layout.tsx
│   │   └── page.tsx                # Root → redirects to /dashboard
│   ├── components/                 # shadcn/ui + custom components
│   ├── hooks/                      # Custom React hooks
│   └── lib/
│       ├── api/
│       │   ├── auth.ts             # getAuth() helper
│       │   ├── response.ts         # json/error/created/noContent helpers
│       │   ├── hooks.ts            # All TanStack Query hooks
│       │   └── services/
│       │       ├── BaseService.ts
│       │       ├── account.service.ts
│       │       └── profile.service.ts
│       ├── supabase/
│       │   ├── client.ts           # Browser client
│       │   ├── server.ts           # Server client (async cookies)
│       │   └── database.types.ts   # Generated types
│       └── plaid/
│           └── client.ts           # Plaid SDK instance
├── supabase/
│   ├── migrations/
│   │   ├── 20260224181150_init.sql
│   │   ├── 20260224181227_baseline.sql
│   │   ├── 20260226000001_profiles_add_base_currency.sql
│   │   ├── 20260226000002_plaid_items.sql
│   │   ├── 20260226000003_transactions_add_columns.sql
│   │   └── 20260226000004_fx_rates_and_audit_log.sql
│   └── seed.sql                    # Dev seed: test@charlie.dev / password123
└── docs/
```

---

## 2. Frontend Page Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Root — redirects to `/dashboard` |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Summary cards, recent transactions, monthly spend |
| `/transactions` | `app/(app)/transactions/page.tsx` | Paginated transaction list with filters and search |
| `/accounts` | `app/(app)/accounts/page.tsx` | Manual accounts + Plaid bank linking |
| `/budgets` | `app/(app)/budgets/page.tsx` | Month-by-month budget creation and line management |
| `/categories` | `app/(app)/categories/page.tsx` | Create/archive/delete transaction categories |
| `/reports` | `app/(app)/reports/page.tsx` | Monthly trend chart + category breakdown |
| `/investments` | `app/(app)/investments/page.tsx` | Portfolio: holdings, trades, dividends, DRIP calculator |
| `/settings` | `app/(app)/settings/page.tsx` | Display name, base currency, data export, account deletion |
| `/login` | `app/(auth)/login/page.tsx` | Sign in |
| `/signup` | `app/(auth)/signup/page.tsx` | Register |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Password reset |

All `(app)` routes are inside a shared group layout that handles authentication. The `(auth)` group is public-facing.

---

## 3. API Routes — Detailed

All routes use:
- `getAuth()` → returns `{ user, supabase }` or a 401 response
- `json() / error() / created() / noContent()` helpers from `lib/api/response.ts`
- Supabase RLS automatically scopes every query to the authenticated user

---

### Categories — `/api/categories`

#### `GET /api/categories`
```
Query params:
  include_archived?: "true" | "false"  (default: false)

Response 200:
  { categories: CategoryResponse[] }

Where CategoryResponse = {
  id, user_id, name, kind, sort_order, archived, created_at
}
```

#### `POST /api/categories`
```
Body:
  { name: string, kind: "income"|"expense"|"transfer", sort_order?: number }

Response 201:
  CategoryResponse

Notes:
  - Auto-increments sort_order if omitted (max existing + 1)
```

#### `PATCH /api/categories/[id]`
```
Body:
  { name?: string, sort_order?: number, archived?: boolean }

Response 200:
  CategoryResponse
```

#### `DELETE /api/categories/[id]`
```
Response 204

Notes:
  - Blocked (409) if any non-deleted transaction uses this category
```

---

### Accounts — `/api/accounts`

#### `GET /api/accounts`
```
Response 200:
  { accounts: AccountResponse[] }

Where AccountResponse = {
  id, user_id, name, type, source, currency, current_balance,
  balance_as_of, archived, created_at,
  plaid_item?: { institution_name, needs_reauth, last_synced_at }
}
```

#### `POST /api/accounts`
```
Body:
  { name: string, type: string, currency?: string, current_balance?: number }

Response 201:
  AccountResponse

Notes:
  - Creates manual account (source = 'manual')
  - Plaid accounts are created via /api/plaid/exchange-token
```

#### `PATCH /api/accounts/[id]`
```
Body:
  { name?: string, archived?: boolean }

Response 200:
  AccountResponse
```

#### `DELETE /api/accounts/[id]`
```
Response 204

Notes:
  - Plaid accounts: revokes Plaid access token, soft-deletes transactions,
    deletes plaid_item record
  - Manual accounts: FK cascade deletes all transactions
```

---

### Transactions — `/api/transactions`

#### `GET /api/transactions`
```
Query params:
  page?:        number   (default: 1)
  per_page?:    number   (default: 50)
  account_id?:  uuid
  category_id?: uuid
  start_date?:  date (YYYY-MM-DD)
  end_date?:    date (YYYY-MM-DD)
  search?:      string   (iLIKE on merchant OR note)
  pending?:     "true"|"false"

Response 200:
  {
    data: TransactionResponse[],
    pagination: { page, per_page, total, total_pages }
  }

Notes:
  - Excludes soft-deleted (deleted_at IS NOT NULL)
  - Ordered by txn_date DESC, created_at DESC
```

#### `POST /api/transactions`
```
Body:
  {
    account_id:   uuid,
    txn_date:     date,
    amount:       number,   (negative = expense, positive = income)
    category_id?: uuid,
    merchant?:    string,
    note?:        string,
    currency?:    string    (defaults to account currency)
  }

Response 201:
  TransactionResponse

Notes:
  - Sets source = 'manual'
  - Sets amount_base = amount (no FX applied at creation)
```

#### `PATCH /api/transactions/[id]`
```
Body:
  { category_id?: uuid, note?: string, merchant?: string, needs_review?: boolean }

Response 200:
  TransactionResponse
```

#### `DELETE /api/transactions/[id]`
```
Response 204

Notes:
  - Soft delete: sets deleted_at = now()
```

#### `PATCH /api/transactions/bulk`
```
Body:
  {
    ids:          uuid[],
    action:       "recategorize" | "delete",
    category_id?: uuid   (required when action = "recategorize")
  }

Response 200:
  { updated: number }
```

---

### Budgets — `/api/budgets`

#### `GET /api/budgets`
```
Query params:
  month: string (YYYY-MM, e.g. "2026-03")

Response 200:
  { budget: BudgetResponse | null }

Where BudgetResponse = {
  id, user_id, month, created_at,
  lines: [{
    id, category_id, category_name, category_kind,
    planned_amount, actual_amount
  }]
}

Notes:
  - Returns null if no budget exists for that month
  - actual_amount is calculated from non-deleted, non-pending transactions
    for the month matching each line's category
```

#### `POST /api/budgets`
```
Body:
  { month: string }   (e.g. "2026-03")

Response 201:
  BudgetResponse

Notes:
  - Normalizes month to first day (e.g. "2026-03-01")
  - 409 if budget already exists for that month
```

#### `POST /api/budgets/[id]/lines`
```
Body:
  { category_id: uuid, planned_amount: number }

Response 201:
  BudgetLineResponse

Notes:
  - 409 if that category already has a line in this budget
```

#### `PATCH /api/budgets/[id]/lines/[lineId]`
```
Body:
  { planned_amount: number }

Response 200:
  BudgetLineResponse
```

#### `DELETE /api/budgets/[id]/lines/[lineId]`
```
Response 204
```

#### `POST /api/budgets/copy`
```
Body:
  { source_month: string, target_month: string }

Response 201:
  BudgetResponse

Notes:
  - Copies all budget lines from source_month to target_month
  - Creates new budget for target_month if one doesn't exist
  - 404 if source_month has no budget
  - 409 if target_month already has a budget
```

---

### Settings — `/api/settings`

#### `GET /api/settings`
```
Response 200:
  { profile: ProfileResponse }

Where ProfileResponse = {
  id, display_name, base_currency, created_at
}
```

#### `PATCH /api/settings/profile`
```
Body:
  { display_name: string }   (max 100 chars)

Response 200:
  ProfileResponse
```

#### `POST /api/settings/currency`
```
Body:
  { currency: string }   (3-char ISO code, e.g. "EUR")

Response 200:
  { base_currency: string }

Notes:
  1. Validates 3-char length (no ISO list validation)
  2. Fetches FX rates from Open Exchange Rates API
  3. Updates profile.base_currency
  4. Recalculates amount_base for all user transactions using fetched rates
```

#### `DELETE /api/settings/account`
```
Body:
  { confirm: "DELETE" }

Response 204

Notes:
  1. Validates confirm string
  2. Revokes all Plaid access tokens (errors swallowed)
  3. Writes audit log entry
  4. Soft-deletes budgets, transactions, accounts, categories, plaid_items
  5. Hard-deletes profile record
  6. Signs out user session
```

#### `POST /api/settings/export`
```
Body:
  { format: "csv" | "json" }

Response:
  CSV download or JSON file download

CSV includes: transactions with headers
JSON includes: { exported_at, accounts, transactions, categories, budgets }
```

---

### Plaid — `/api/plaid`

#### `POST /api/plaid/link-token`
```
Body:
  { mode?: "create" | "update", plaid_item_id?: uuid }

Response 200:
  { link_token: string }

Notes:
  - mode "update" + plaid_item_id: fetches access_token_enc for update flow
  - Products: [Transactions], Country: [US]
```

#### `POST /api/plaid/exchange-token`
```
Body:
  { public_token: string, institution_id: string, institution_name: string }

Response 200:
  { plaid_item_id: uuid, accounts: AccountResponse[] }

Flow:
  1. Exchange public_token → access_token via Plaid
  2. Check if institution_id already linked (returns existing if so)
  3. Store plaid_item record with encrypted access_token
  4. Fetch accounts via accountsGet()
  5. Insert account records (source = 'plaid')
  6. Kick off non-blocking transactionsSync call
```

#### `POST /api/plaid/sync`
```
Body:
  { plaid_item_id: uuid }

Response 200:
  { added: number, modified: number, removed: number, cursor: string }

Flow:
  1. Fetch plaid_item to get access_token and cursor
  2. Call transactionsSync() with cursor
  3. Handle added: upsert transactions (negates amounts)
  4. Handle modified: update existing transactions
  5. Handle removed: soft-delete transactions
  6. Update cursor and last_synced_at on plaid_item

Notes:
  - Plaid amounts are positive for debits; stored negated (negative = expense)
  - Deduplication: uses plaid_transaction_id unique constraint (silent skip on conflict)
```

---

### Reports — `/api/reports`

#### `GET /api/reports/monthly-trend`
```
Query params:
  months?: number   (default: 12)

Response 200:
  { data: MonthlyTrendPoint[] }

Where MonthlyTrendPoint = {
  month: string,    (YYYY-MM)
  income: number,
  spending: number,
  net: number       (income - |spending|)
}

Notes:
  - Uses amount_base (base currency normalized)
  - Excludes deleted and pending transactions
```

#### `GET /api/reports/category-breakdown`
```
Query params:
  start_date: date
  end_date:   date
  kind?:      "expense" | "income"   (default: "expense")

Response 200:
  { data: CategoryBreakdownItem[], grand_total: number }

Where CategoryBreakdownItem = {
  category_id, category_name,
  total: number,
  percentage: number
}

Notes:
  - Normalizes totals to absolute values
  - Calculates percentages from grand_total
  - Excludes deleted and pending transactions
```

---

### Investments — `/api/investments`

> **WARNING: All investment endpoints are non-functional — the database tables do not exist. See [Bug #1](#critical-bugs).**

#### `GET /api/investments/accounts`
#### `POST /api/investments/accounts`
#### `PATCH /api/investments/accounts/[id]`
#### `DELETE /api/investments/accounts/[id]`

Manages `investment_accounts` table (missing migration).

#### `GET /api/investments/holdings`
```
Query params:
  account_id?: uuid

Response 200:
  { holdings: HoldingResponse[] }

Where HoldingResponse = {
  id, account_id, ticker, quantity, avg_cost,
  current_price, market_value, unrealized_pnl, unrealized_pnl_pct
}

Notes:
  - market_value, unrealized_pnl, unrealized_pnl_pct are computed server-side
```

#### `GET /api/investments/trades`
#### `POST /api/investments/trades`
```
Body:
  {
    account_id: uuid,
    ticker:     string,   (uppercased)
    side:       "buy" | "sell",
    quantity:   number,
    price:      number,
    trade_date: date
  }

Notes:
  - Buy: updates avg_cost on existing holding (weighted average) or creates new
  - Sell: reduces quantity, deletes holding if reaches 0
  - Error (400) if sell quantity exceeds held quantity
```

#### `GET /api/investments/dividends`
#### `POST /api/investments/dividends`
```
Body:
  {
    account_id: uuid,
    ticker:     string,
    amount:     number,
    per_share?: number,
    ex_date?:   date,
    pay_date?:  date
  }
```

---

## 4. Database Schema

### Core Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | FK → auth.users, DELETE CASCADE |
| `display_name` | text | |
| `base_currency` | text | default 'USD' |
| `created_at` | timestamptz | |

RLS: select/update own row only. Auto-created on signup via `handle_new_user()` trigger.

---

#### `categories`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `name` | text | |
| `kind` | enum | 'income' \| 'expense' \| 'transfer' |
| `sort_order` | integer | |
| `archived` | boolean | default false |
| `created_at` | timestamptz | |

Indexes: `user_id`, `(user_id, lower(name))`

---

#### `accounts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `name` | text | |
| `type` | text | 'checking', 'savings', 'credit', etc. |
| `source` | enum | 'manual' \| 'plaid' |
| `plaid_account_id` | text | nullable, unique |
| `plaid_item_id` | uuid | nullable, FK → plaid_items |
| `currency` | text | default 'USD' |
| `current_balance` | numeric | |
| `balance_as_of` | timestamptz | |
| `archived` | boolean | default false |
| `created_at` | timestamptz | |

---

#### `transactions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `account_id` | uuid | FK → accounts, DELETE CASCADE |
| `category_id` | uuid | nullable, FK → categories, DELETE SET NULL |
| `txn_date` | date | |
| `amount` | numeric | negative = expense, positive = income |
| `currency` | text | default 'USD' |
| `amount_base` | numeric | amount converted to user's base_currency |
| `merchant` | text | |
| `note` | text | |
| `source` | enum | 'manual' \| 'plaid' |
| `plaid_transaction_id` | text | nullable, unique |
| `pending` | boolean | default false |
| `needs_review` | boolean | possible duplicate flag |
| `deleted_at` | timestamptz | soft delete |
| `created_at` | timestamptz | |

Indexes: `(user_id, txn_date DESC)`, `(account_id, txn_date DESC)`

---

#### `budgets`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `month` | date | normalized to first of month |
| `created_at` | timestamptz | |

Unique: `(user_id, month)`

---

#### `budget_lines`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `budget_id` | uuid | FK → budgets, DELETE CASCADE |
| `category_id` | uuid | FK → categories, DELETE RESTRICT |
| `planned_amount` | numeric | |
| `created_at` | timestamptz | |

Unique: `(budget_id, category_id)`

---

#### `plaid_items`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users, DELETE CASCADE |
| `institution_id` | text | |
| `institution_name` | text | |
| `access_token_enc` | text | encrypted access token |
| `item_id` | text | unique, Plaid's item identifier |
| `cursor` | text | nullable, transactionsSync cursor |
| `needs_reauth` | boolean | default false |
| `last_synced_at` | timestamptz | |
| `created_at` | timestamptz | |

---

#### `fx_rates`
| Column | Type | Notes |
|--------|------|-------|
| `date` | date | PK |
| `rates` | jsonb | e.g. `{ "EUR": 0.92, "GBP": 0.79 }` |
| `fetched_at` | timestamptz | |

No RLS — shared cache across all users.

---

#### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `action` | text | e.g. 'account.deleted', 'plaid_item.linked' |
| `table_name` | text | |
| `record_id` | uuid | |
| `diff` | jsonb | before/after snapshot |
| `created_at` | timestamptz | |

RLS: read own rows only. No user write access.

---

#### Investment Tables (MISSING — no migrations exist)
- `investment_accounts`
- `investment_holdings`
- `investment_trades`
- `investment_dividends`

---

## 5. Frontend Data Fetching

All data fetching uses TanStack Query v5 hooks defined in `lib/api/hooks.ts`. Mutations invalidate relevant query keys to keep the UI in sync.

| Page | Hooks Used |
|------|------------|
| Dashboard | `useAccounts()`, `useTransactions({ per_page: 5 })`, `useTransactions({ start_date, end_date, per_page: 200 })` |
| Transactions | `useTransactions(filters)`, `useAccounts()`, `useCategories()` |
| Accounts | `useAccounts()`, `useLinkToken()`, `useExchangeToken()`, `useSyncPlaid()` |
| Budgets | `useBudget(month)`, `useCategories()`, `useCreateBudget()`, `useCopyBudget()`, `useAddBudgetLine()`, `useUpdateBudgetLine()`, `useDeleteBudgetLine()` |
| Categories | `useCategories(showArchived)`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()` |
| Reports | `useMonthlyTrend(months)`, `useCategoryBreakdown({ start_date, end_date, kind })` |
| Investments | `useInvestmentAccounts()`, `useHoldings(accountId)`, `useTrades()`, `useCreateTrade()`, `useDividends()`, `useCreateDividend()` |
| Settings | `useProfile()` + `useAccounts()` via SSR `HydrationBoundary` prefetch |

---

## 6. Shared Utilities

### `lib/api/auth.ts` — `getAuth()`
Returns `{ user, supabase }` for authenticated requests, or a 401 `NextResponse` if not signed in. Every API route calls this first.

### `lib/api/response.ts`
```ts
json(data, status?)    // NextResponse.json wrapper
error(message, status) // { error: message }
created(data)          // json(data, 201)
noContent()            // new Response(null, { status: 204 })
```

### `lib/api/hooks.ts`
Central file for all TanStack Query hooks. Includes:
- `apiFetch(url, init?)` — fetch wrapper with error handling
- `apiMutate(url, method, body?)` — mutation wrapper
- One `useXxx()` query + mutation hooks per entity

### `lib/supabase/server.ts`
Creates server-side Supabase client using async Next.js 15 `cookies()`. Must be `await`ed.

### `lib/supabase/client.ts`
Browser-side Supabase client using anon key.

### `lib/plaid/client.ts`
Plaid SDK client configured from `PLAID_ENV`, `PLAID_CLIENT_ID`, `PLAID_SECRET` env vars. Supports sandbox and production.

### `lib/api/services/`
- `BaseService` — holds `supabase` client + `user`
- `AccountService` — `getAccounts()`, `createAccount()`
- `ProfileService` — `getProfile()`, `updateProfileDisplayName()`, `updateBaseCurrency()`

---

## 7. Bugs, Missing Implementations & Inconsistencies

### Critical Bugs

#### Bug #1 — Investment tables don't exist in the database
**Severity: Critical**

All 9 investment API endpoints query tables (`investment_accounts`, `investment_holdings`, `investment_trades`, `investment_dividends`) that have no corresponding migration. Every investment route will return a 500 error.

**Fix:** Create a migration file:
```sql
create table investment_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  broker text,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table investment_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references investment_accounts(id) on delete cascade,
  ticker text not null,
  quantity numeric not null default 0,
  avg_cost numeric not null default 0,
  current_price numeric not null default 0,
  unique(account_id, ticker)
);

create table investment_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references investment_accounts(id) on delete cascade,
  ticker text not null,
  side text not null check (side in ('buy', 'sell')),
  quantity numeric not null,
  price numeric not null,
  total numeric not null,
  trade_date date not null,
  created_at timestamptz not null default now()
);

create table investment_dividends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references investment_accounts(id) on delete cascade,
  ticker text not null,
  amount numeric not null,
  per_share numeric,
  ex_date date,
  pay_date date,
  created_at timestamptz not null default now()
);

-- RLS
alter table investment_accounts enable row level security;
alter table investment_holdings enable row level security;
alter table investment_trades enable row level security;
alter table investment_dividends enable row level security;

create policy "own" on investment_accounts for all using (auth.uid() = user_id);
create policy "own" on investment_holdings for all using (auth.uid() = user_id);
create policy "own" on investment_trades for all using (auth.uid() = user_id);
create policy "own" on investment_dividends for all using (auth.uid() = user_id);
```

---

#### Bug #2 — Dashboard transaction field mismatch (`description` vs `merchant`)
**Severity: High**

The dashboard page renders `t.description` and `t.date` for transactions, but the API returns `txn_date` and `merchant` (there is no `description` field in the schema).

**Fix:** Either update the dashboard component to use `t.merchant` and `t.txn_date`, or map in the hook:
```ts
// In hook or component:
description: txn.merchant ?? txn.note ?? '—',
date: txn.txn_date,
```

---

#### Bug #3 — Plaid re-auth update flow not implemented
**Severity: High**

`POST /api/plaid/link-token` supports `mode: "update"` (for re-linking expired tokens), but `POST /api/plaid/exchange-token` always inserts a new `plaid_item` record. There is no update path — calling exchange-token after a re-auth flow will either duplicate the item or silently fail.

**Fix:** In exchange-token, check if `plaid_item_id` is passed in the body. If so, update the existing record's `access_token_enc` and reset `needs_reauth = false` instead of inserting.

---

### Moderate Issues

#### Issue #4 — Currency code validation too weak
`POST /api/settings/currency` only checks `currency.length === 3`. An invalid code like "XYZ" will succeed, corrupt `base_currency`, and produce incorrect FX conversions.

**Fix:** Validate against a known ISO 4217 list, or at minimum check if Open Exchange Rates returns a valid rate for the currency before saving.

---

#### Issue #5 — FX conversion updates transactions one-by-one
In `POST /api/settings/currency`, the route updates `amount_base` for each transaction in a loop rather than using a batch SQL update. For users with thousands of transactions this will be very slow and may time out.

**Fix:** Use a single SQL UPDATE with a join to fx_rates, or at minimum use Supabase's `in` filter with batches of 500.

---

#### Issue #6 — Budget actuals query is unfiltered
`GET /api/budgets` fetches ALL non-deleted, non-pending transactions for the month and then groups them in JS. For users with many transactions this is wasteful.

**Fix:** Use a `GROUP BY category_id` SQL query with a `SUM` instead of fetching all rows and aggregating in application code.

---

#### Issue #7 — No validation on report date ranges
`GET /api/reports/category-breakdown` doesn't validate that `end_date >= start_date`. An inverted range returns an empty result with no error, which can confuse the frontend.

---

#### Issue #8 — Plaid sync dedup not implemented
Comments in the migration reference `needs_review` for duplicate detection, and docs mention dedup logic. The actual sync handler silently skips duplicates via unique constraint on `plaid_transaction_id` but never sets `needs_review = true`.

---

#### Issue #9 — DRIP calculator and investments hardcoded to USD
The investments page formats currency values as USD regardless of the user's `base_currency` preference.

---

#### Issue #10 — Account balance not updated after Plaid sync
`POST /api/plaid/sync` fetches and stores transactions but does not update `current_balance` / `balance_as_of` on the linked accounts.

---

#### Issue #11 — No pagination on categories, investments, or budgets
Categories, investment accounts/holdings/trades, and budgets have no pagination. Large datasets will degrade performance and increase response size unbounded.

---

#### Issue #12 — Settings page uses inconsistent data fetching pattern
Settings uses SSR `HydrationBoundary` prefetch while every other page uses pure client-side TanStack Query. This is not a bug but creates inconsistency in error/loading handling patterns.

---

### Minor Issues

#### Issue #13 — No React error boundaries on pages
Unhandled query errors crash the entire page rather than showing a contained error state.

#### Issue #14 — Plaid token revocation errors swallowed on account deletion
Account deletion catches and ignores Plaid revocation errors, so the user has no way to know if revocation failed (leaving the bank connection dangling on Plaid's side).

#### Issue #15 — Export API omits audit log
The JSON export includes accounts, transactions, categories, and budgets but not the audit log, which may be useful for data portability.

#### Issue #16 — `database.types.ts` lacks investment table types
Since investment tables have no migration, the generated types file doesn't include them. Investment routes likely use untyped `any` casts.

---

## 8. Quick-Reference API Table

| Method | Route | Status | Key Inputs | Response |
|--------|-------|--------|------------|----------|
| GET | `/api/accounts` | ✅ | — | `{ accounts[] }` |
| POST | `/api/accounts` | ✅ | name, type, currency, balance | AccountResponse |
| PATCH | `/api/accounts/[id]` | ✅ | name?, archived? | AccountResponse |
| DELETE | `/api/accounts/[id]` | ✅ | — | 204 |
| GET | `/api/categories` | ✅ | include_archived? | `{ categories[] }` |
| POST | `/api/categories` | ✅ | name, kind, sort_order? | CategoryResponse |
| PATCH | `/api/categories/[id]` | ✅ | name?, sort_order?, archived? | CategoryResponse |
| DELETE | `/api/categories/[id]` | ✅ | — | 204 |
| GET | `/api/transactions` | ✅ | page, per_page, filters | `{ data[], pagination }` |
| POST | `/api/transactions` | ✅ | account_id, txn_date, amount, ... | TransactionResponse |
| PATCH | `/api/transactions/[id]` | ✅ | category_id?, note?, ... | TransactionResponse |
| DELETE | `/api/transactions/[id]` | ✅ | — | 204 (soft delete) |
| PATCH | `/api/transactions/bulk` | ✅ | ids[], action, category_id? | `{ updated: n }` |
| GET | `/api/budgets` | ✅ | month | `{ budget: null \| {...} }` |
| POST | `/api/budgets` | ✅ | month | BudgetResponse |
| POST | `/api/budgets/[id]/lines` | ✅ | category_id, planned_amount | BudgetLineResponse |
| PATCH | `/api/budgets/[id]/lines/[lineId]` | ✅ | planned_amount | BudgetLineResponse |
| DELETE | `/api/budgets/[id]/lines/[lineId]` | ✅ | — | 204 |
| POST | `/api/budgets/copy` | ✅ | source_month, target_month | BudgetResponse |
| GET | `/api/settings` | ✅ | — | `{ profile }` |
| PATCH | `/api/settings/profile` | ✅ | display_name | ProfileResponse |
| POST | `/api/settings/currency` | ✅ | currency | `{ base_currency }` |
| DELETE | `/api/settings/account` | ✅ | `{ confirm: "DELETE" }` | 204 |
| POST | `/api/settings/export` | ✅ | format | File download |
| POST | `/api/plaid/link-token` | ✅ | mode?, plaid_item_id? | `{ link_token }` |
| POST | `/api/plaid/exchange-token` | ✅ | public_token, institution_id, name | `{ plaid_item_id, accounts[] }` |
| POST | `/api/plaid/sync` | ✅ | plaid_item_id | `{ added, modified, removed, cursor }` |
| GET | `/api/reports/monthly-trend` | ✅ | months? | `{ data[] }` |
| GET | `/api/reports/category-breakdown` | ✅ | start_date, end_date, kind? | `{ data[], grand_total }` |
| GET | `/api/investments/accounts` | ❌ BROKEN | — | **Missing DB table** |
| POST | `/api/investments/accounts` | ❌ BROKEN | name, broker?, currency | **Missing DB table** |
| PATCH | `/api/investments/accounts/[id]` | ❌ BROKEN | name?, broker? | **Missing DB table** |
| DELETE | `/api/investments/accounts/[id]` | ❌ BROKEN | — | **Missing DB table** |
| GET | `/api/investments/holdings` | ❌ BROKEN | account_id? | **Missing DB table** |
| GET | `/api/investments/trades` | ❌ BROKEN | account_id?, ticker? | **Missing DB table** |
| POST | `/api/investments/trades` | ❌ BROKEN | account_id, ticker, side, qty, price, date | **Missing DB table** |
| GET | `/api/investments/dividends` | ❌ BROKEN | account_id? | **Missing DB table** |
| POST | `/api/investments/dividends` | ❌ BROKEN | account_id, ticker, amount, ... | **Missing DB table** |
