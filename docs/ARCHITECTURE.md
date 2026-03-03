# Charlie Budget App - Complete Architecture Guide

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Tech Stack & Why](#tech-stack--why)
3. [Project Structure](#project-structure)
4. [Data Architecture](#data-architecture)
5. [Request Flow (Complete End-to-End)](#request-flow-complete-end-to-end)
6. [Authentication & Security](#authentication--security)
7. [API Route Handlers (Detailed)](#api-route-handlers-detailed)
8. [Plaid Integration](#plaid-integration)
9. [Design Decisions](#design-decisions)

---

## High-Level Overview

Charlie is a **full-stack personal finance web application** with three main layers:

```
┌─────────────────────────────────────────────────┐
│         Browser (React Frontend)                │  ← NOT BUILT YET
│  - UI Components (charts, forms, lists)         │
│  - TanStack Query (data fetching & caching)     │
│  - Form validation & state management           │
└──────────────────┬──────────────────────────────┘
                   │
         HTTP Requests/Responses
                   │
┌──────────────────▼──────────────────────────────┐
│   Next.js Backend (16 API Route Handlers)       │  ← BUILT
│  - POST /api/categories                         │
│  - GET/POST /api/accounts                       │
│  - GET/POST /api/transactions                   │
│  - GET/POST /api/budgets                        │
│  - GET/POST/PATCH/DELETE /api/savings-goals     │
│  - POST/DELETE /api/plaid/*                     │
│  - GET /api/settings                            │
│                                                  │
│  All routes: authenticate → validate → query    │
└──────────────────┬──────────────────────────────┘
                   │
            SQL Queries
                   │
┌──────────────────▼──────────────────────────────┐
│   Supabase (PostgreSQL + Auth)                  │
│  - Managed PostgreSQL database                  │
│  - Row-Level Security (RLS) policies            │
│  - Supabase Auth (session management)           │
│  - Real-time subscriptions (optional)           │
└──────────────────────────────────────────────────┘

         External APIs
         ┌─────────────────┐
         │  Plaid (Banking)│ ← Link bank accounts, sync transactions
         │  OpenExchange   │ ← Historical FX rates for multi-currency
         └─────────────────┘
```

---

## Tech Stack & Why

| Layer              | Technology                           | Why                                                                  |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------- |
| **Frontend**       | React 19 + Next.js 16.1.6            | Server/client components, built-in API routes, great DX              |
| **Styling**        | Tailwind CSS v4 + shadcn/ui          | Utility-first, accessible components, fast iteration                 |
| **Data Fetching**  | TanStack Query v5                    | Client-side caching, automatic refetching, optimistic updates        |
| **Database**       | Supabase (PostgreSQL 17)             | Managed, RLS for security, built-in auth, generous free tier         |
| **Auth**           | @supabase/ssr + cookies              | Secure session-based auth, SSR-compatible, no third-party dependency |
| **Bank Linking**   | Plaid SDK v41                        | Industry standard, supports 12k+ institutions, secure token exchange |
| **Real-time Sync** | PostgreSQL webhooks + Plaid webhooks | Passive polling on schedule, push from Plaid when changes occur      |

**Why this stack?**

- **Monolithic simplicity**: Backend and frontend in one repo (Next.js)
- **Type safety**: TypeScript everywhere (Supabase auto-generates types)
- **Security by default**: RLS prevents data leaks, cookies are HttpOnly
- **Scalability**: Supabase handles DB scaling, Next.js handles API scaling
- **Cost**: Generous free tiers for all services

---

## Project Structure

```
web/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Home page (GET /)
│   ├── layout.tsx                    # Root layout
│   └── api/                          # API routes (backend)
│       ├── categories/
│       │   ├── route.ts              # GET/POST /api/categories
│       │   └── [id]/route.ts         # PATCH/DELETE /api/categories/[id]
│       ├── accounts/
│       │   ├── route.ts              # GET/POST /api/accounts
│       │   └── [id]/route.ts         # PATCH/DELETE /api/accounts/[id]
│       ├── transactions/
│       │   ├── route.ts              # GET/POST /api/transactions
│       │   ├── [id]/route.ts         # PATCH/DELETE /api/transactions/[id]
│       │   └── bulk/route.ts         # PATCH /api/transactions/bulk
│       ├── budgets/
│       │   ├── route.ts              # GET/POST /api/budgets
│       │   ├── copy/route.ts         # POST /api/budgets/copy
│       │   └── [id]/lines/
│       │       ├── route.ts          # POST /api/budgets/[id]/lines
│       │       └── [lineId]/route.ts # PATCH/DELETE
│       ├── settings/
│       │   ├── route.ts              # GET /api/settings
│       │   └── profile/route.ts      # PATCH /api/settings/profile
│       ├── savings-goals/
│       │   ├── route.ts              # GET/POST /api/savings-goals
│       │   └── [id]/route.ts         # PATCH/DELETE /api/savings-goals/[id]
│       └── plaid/
│           ├── items/[id]/route.ts   # DELETE /api/plaid/items/[id]
│           ├── link-token/route.ts   # POST /api/plaid/link-token
│           ├── exchange-token/route.ts # POST /api/plaid/exchange-token
│           └── sync/route.ts         # POST /api/plaid/sync
│
├── lib/                              # Shared utilities (NOT routes)
│   ├── api/
│   │   ├── auth.ts                   # Authentication helper
│   │   └── response.ts               # Response formatting helpers
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client
│   │   └── database.types.ts         # Auto-generated TypeScript types
│   ├── db/
│   │   └── types.ts                  # Row/Insert/Update type aliases
│   ├── plaid/
│   │   └── client.ts                 # Plaid SDK instance
│   └── ...
│
├── components/                       # React components (NOT BUILT YET)
│   ├── AccountList.tsx
│   ├── TransactionTable.tsx
│   └── ...
│
├── package.json                      # Dependencies
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind CSS config
└── .env.local                        # Secrets (not committed)

supabase/
├── migrations/                       # Database migrations (SQL)
│   ├── 20260226000001_profiles_add_base_currency.sql
│   ├── 20260226000002_plaid_items.sql
│   ├── 20260226000003_transactions_add_columns.sql
│   └── 20260226000004_fx_rates_and_audit_log.sql
├── seed.sql                          # Test data
└── config.toml                       # Supabase local dev config

docs/
├── api-routes.md                     # Full API contract
├── supabase-setup.md                 # DB setup guide
└── ARCHITECTURE.md                   # This file
```

---

## Data Architecture

### Database Schema (PostgreSQL + RLS)

```sql
-- Profiles (user settings)
profiles
  ├─ id (uuid, pk)
  ├─ user_id (uuid, fk to auth.users)  ← Supabase manages this
  ├─ display_name (text)
  ├─ base_currency (text, default 'USD')
  ├─ country (text, nullable)  ← For holiday predictions
  └─ created_at (timestamp)

-- Categories (expense/income/transfer buckets)
categories
  ├─ id (uuid, pk)
  ├─ user_id (uuid)  ← RLS: users can only see their own
  ├─ name (text, unique per user)
  ├─ kind (expense|income|transfer)
  ├─ sort_order (integer)
  ├─ archived (boolean, default false)
  └─ created_at (timestamp)

-- Accounts (bank accounts + manual accounts)
accounts
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ name (text)
  ├─ type (checking|savings|credit_card|etc)
  ├─ source (manual|plaid)  ← How was it created
  ├─ plaid_item_id (uuid, fk→plaid_items)  ← Null for manual
  ├─ currency (text, default 'USD')
  ├─ current_balance (numeric)
  ├─ balance_as_of (timestamp)
  ├─ archived (boolean)
  └─ created_at (timestamp)

-- Plaid Items (linked institutions)
plaid_items
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ access_token (text, encrypted in Vault)  ← Never leaves server
  ├─ institution_id (text)
  ├─ institution_name (text)
  ├─ sync_cursor (text)  ← For incremental sync
  ├─ last_synced_at (timestamp)
  ├─ needs_reauth (boolean)  ← User needs to re-authorize
  ├─ created_at (timestamp)
  └─ updated_at (timestamp)

-- Transactions (income/expense entries)
transactions
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ account_id (uuid, fk→accounts)
  ├─ category_id (uuid, fk→categories, nullable)
  ├─ txn_date (date)
  ├─ amount (numeric)  ← Negative = expense, positive = income
  ├─ amount_base (numeric)  ← In user's base_currency
  ├─ currency (text, default 'USD')
  ├─ merchant (text)  ← "Whole Foods", "Starbucks"
  ├─ note (text)  ← User notes
  ├─ pending (boolean)  ← Not yet settled
  ├─ source (manual|plaid)
  ├─ plaid_transaction_id (text, unique, nullable)  ← Prevents Plaid dupes
  ├─ needs_review (boolean)  ← Flagged for manual/Plaid conflict
  ├─ deleted_at (timestamp, nullable)  ← Soft delete (not hard delete)
  └─ created_at (timestamp)

-- Savings Goals (envelope budgeting / long term targets)
savings_goals
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ name (text)
  ├─ target_amount (numeric)
  ├─ current_amount (numeric, default 0)
  ├─ currency (text, default 'USD')
  ├─ target_date (date, nullable)
  ├─ color (text, nullable)
  ├─ emoji (text, nullable)
  ├─ archived (boolean, default false)
  └─ created_at (timestamp)

-- Budgets (monthly spending plans)
budgets
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ month (date, unique per user)  ← 2026-02-01, 2026-03-01
  ├─ created_at (timestamp)

-- Budget Lines (per-category budget)
budget_lines
  ├─ id (uuid, pk)
  ├─ budget_id (uuid, fk→budgets)
  ├─ category_id (uuid, fk→categories)
  ├─ planned_amount (numeric)
  ├─ created_at (timestamp)

-- FX Rates (historical exchange rates, shared cache)
fx_rates
  ├─ id (uuid, pk)
  ├─ rate_date (date)
  ├─ from_currency (text)
  ├─ to_currency (text)
  ├─ rate (numeric)
  ├─ source (text)  ← "open_exchange_rates"
  └─ created_at (timestamp)

-- Audit Log (immutable activity log)
audit_log
  ├─ id (uuid, pk)
  ├─ user_id (uuid)
  ├─ action (text)  ← "plaid_token_revoked", "account_deleted"
  ├─ details (jsonb)  ← { plaid_item_id: "...", reason: "..." }
  ├─ created_at (timestamp)
```

### Row-Level Security (RLS)

Every table has a policy like:

```sql
-- Categories example
CREATE POLICY "users_see_own_categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);  ← Only return rows where user_id = logged-in user

CREATE POLICY "users_create_categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);  ← Only insert if user_id = logged-in user
```

**How it works:**

1. User logs in → Supabase sets `auth.uid()` in session
2. Every query is automatically filtered by `auth.uid()`
3. If user tries to access another user's category, RLS blocks it (404)
4. This happens at the database level (not in application code)

---

## Request Flow (Complete End-to-End)

Let me trace a real example: **User creates a new transaction**

### Step 1: Frontend (Browser)

```tsx
// User fills out form:
// Account: "Chase Checking"
// Date: "2026-02-25"
// Amount: "-52.40" (expense)
// Category: "Groceries"
// Merchant: "Whole Foods"

// User clicks "Create" button
const response = await fetch("/api/transactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    account_id: "550e8400-e29b-41d4-a716-446655440000",
    txn_date: "2026-02-25",
    amount: -52.4,
    category_id: "650e8400-e29b-41d4-a716-446655440001",
    merchant: "Whole Foods",
    currency: "USD",
  }),
});
```

### Step 2: Network

Browser sends HTTP request:

```
POST /api/transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Cookie: sb-access-token=eyJhbGc...; sb-refresh-token=eyJhbGc...

{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "txn_date": "2026-02-25",
  "amount": -52.40,
  "category_id": "650e8400-e29b-41d4-a716-446655440001",
  "merchant": "Whole Foods",
  "currency": "USD"
}
```

### Step 3: Next.js Route Handler

```ts
// web/app/api/transactions/route.ts

export async function POST(req: NextRequest) {
  // 3.1 Parse request body
  const body = await req.json();
  // body = {
  //   account_id: "550e8400...",
  //   txn_date: "2026-02-25",
  //   amount: -52.40,
  //   ...
  // }

  // 3.2 Authenticate user (read session cookie)
  const auth = await getAuth();
  if (auth.error) return auth.error; // Return 401 if not logged in
  const { user, supabase } = auth;
  // user.id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

  // 3.3 Validate required fields
  if (!body.account_id || !body.txn_date || body.amount === undefined) {
    return error("Missing required fields", 400);
  }

  // 3.4 Verify account exists (and belongs to user)
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", body.account_id)
    .single();

  if (accountError || !account) {
    return error("Account not found", 404);
  }
  // Note: RLS automatically filters to user's accounts only

  // 3.5 Insert transaction
  const { data: transaction, error: insertError } = await supabase
    .from("transactions")
    .insert([
      {
        user_id: user.id, // ← Set user_id from auth
        account_id: body.account_id,
        txn_date: body.txn_date,
        amount: body.amount,
        amount_base: body.amount, // ← For MVP: same as amount
        currency: body.currency || "USD",
        category_id: body.category_id || null,
        merchant: body.merchant || null,
        note: body.note || null,
        source: "manual", // ← Manually created, not from Plaid
        pending: false,
      },
    ])
    .select();

  if (insertError) {
    return error("Failed to create transaction", 500);
  }

  // 3.6 Return 201 Created
  return created(transaction[0]);
  // Response = 201 + { id, user_id, account_id, ... }
}
```

### Step 4: Supabase (Database)

Receives SQL query:

```sql
INSERT INTO transactions (
  user_id, account_id, txn_date, amount, amount_base, currency,
  category_id, merchant, note, source, pending, created_at
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  '550e8400-e29b-41d4-a716-446655440000',
  '2026-02-25',
  -52.40,
  -52.40,
  'USD',
  '650e8400-e29b-41d4-a716-446655440001',
  'Whole Foods',
  NULL,
  'manual',
  false,
  NOW()
) RETURNING *;
```

**RLS checks:**

- Policy: `auth.uid() = user_id` ✓ (logged-in user = user_id in INSERT)
- Database inserts row and returns full row

### Step 5: Response Back to Browser

```json
201 Created

{
  "id": "750e8400-e29b-41d4-a716-446655440002",
  "user_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "650e8400-e29b-41d4-a716-446655440001",
  "txn_date": "2026-02-25",
  "amount": -52.40,
  "amount_base": -52.40,
  "currency": "USD",
  "merchant": "Whole Foods",
  "note": null,
  "pending": false,
  "source": "manual",
  "plaid_transaction_id": null,
  "needs_review": false,
  "deleted_at": null,
  "created_at": "2026-02-25T14:32:15.123Z"
}
```

### Step 6: Frontend Updates UI

```tsx
// Browser receives 201 response
if (response.status === 201) {
  const newTransaction = await response.json();

  // Update UI
  setTransactions([...transactions, newTransaction]);
  // OR use TanStack Query:
  queryClient.invalidateQueries({ queryKey: ["transactions"] });

  // Show success toast
  toast.success("Transaction created!");
}
```

---

## Authentication & Security

### Session-Based Auth with Cookies

```
┌──────────────────────────────────────────────────────┐
│ 1. User signs in with email/password               │
│    Supabase auth validates credentials             │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│ 2. Supabase creates JWT tokens                      │
│    - access_token (15 min lifetime)                 │
│    - refresh_token (1 week lifetime)                │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│ 3. Browser stores tokens in HttpOnly cookies       │
│    (Cannot be accessed by JavaScript, XSS-safe)    │
│    - sb-access-token=eyJhbGc...                    │
│    - sb-refresh-token=eyJhbGc...                   │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│ 4. Every API request includes cookie              │
│    POST /api/transactions                           │
│    Cookie: sb-access-token=eyJhbGc...             │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│ 5. Route handler calls getAuth()                   │
│    - Reads cookie                                   │
│    - Validates JWT with Supabase                   │
│    - Returns { user, supabase } or { error }      │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│ 6. Every query uses user.id                         │
│    SELECT * FROM transactions                       │
│    WHERE user_id = auth.uid()  ← RLS enforces this │
└──────────────────────────────────────────────────────┘
```

### Code Example: getAuth()

```ts
// lib/api/auth.ts

import { supabaseServer } from "@/lib/supabase/server";

type AuthResult =
  | { user: User; supabase: SupabaseClient; error: null }
  | { user: null; supabase: null; error: Response };

export async function getAuth(): Promise<AuthResult> {
  try {
    // Create Supabase client that reads cookies
    const supabase = await supabaseServer();

    // Get current user from session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // No valid session
      return {
        user: null,
        supabase: null,
        error: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // User is authenticated
    return { user, supabase, error: null };
  } catch (err) {
    return {
      user: null,
      supabase: null,
      error: Response.json({ error: "Auth error" }, { status: 401 }),
    };
  }
}
```

### Why Cookies + HttpOnly?

✅ **Secure:**

- XSS attack cannot steal token (HttpOnly = JavaScript cannot access)
- CSRF protected (cookies only sent to matching domain)
- Token automatically included in all requests

❌ **Not Secure:**

- Storing token in localStorage (XSS can steal it)
- Passing token in URL (`/api/transactions?token=...` visible in logs)

---

## API Route Handlers (Detailed)

Let me show you the structure of a complex handler (Categories).

### GET /api/categories (Read)

```ts
// web/app/api/categories/route.ts

import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  // 1. AUTHENTICATION
  const auth = await getAuth();
  if (auth.error) return auth.error; // Return 401 if not logged in
  const { user, supabase } = auth;

  // 2. PARSE QUERY PARAMETERS
  const searchParams = req.nextUrl.searchParams;
  const include_archived = searchParams.get("include_archived") === "true";
  // ?include_archived=true to include archived categories

  // 3. BUILD QUERY
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id) // RLS does this, but explicit is clearer
    .order("sort_order", { ascending: true }); // Order by sort_order

  // 4. APPLY FILTERS
  if (!include_archived) {
    query = query.eq("archived", false); // Exclude archived
  }

  // 5. EXECUTE QUERY
  const { data: categories, error: dbError } = await query;

  if (dbError) {
    return error("Failed to fetch categories", 500);
  }

  // 6. RETURN RESPONSE
  return json({ categories });
}
```

**Calling this endpoint:**

```bash
# GET all active categories
curl -X GET http://localhost:3000/api/categories \
  -H "Cookie: sb-access-token=..."

# GET all categories (including archived)
curl -X GET "http://localhost:3000/api/categories?include_archived=true" \
  -H "Cookie: sb-access-token=..."
```

### POST /api/categories (Create)

```ts
export async function POST(req: NextRequest) {
  // 1. AUTHENTICATE
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 2. PARSE REQUEST BODY
  const body = await req.json();
  // Expected: { name: "Groceries", kind: "expense", sort_order?: 5 }

  // 3. VALIDATE INPUT
  if (!body.name || !body.kind) {
    return error("name and kind are required", 400);
  }

  if (!["expense", "income", "transfer"].includes(body.kind)) {
    return error("kind must be expense, income, or transfer", 400);
  }

  // 4. GET NEXT SORT_ORDER (if not provided)
  let sort_order = body.sort_order;
  if (sort_order === undefined) {
    // Find max sort_order for this user and add 1
    const { data: categories } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    sort_order = (categories?.[0]?.sort_order ?? 0) + 1;
  }

  // 5. INSERT NEW CATEGORY
  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert([
      {
        user_id: user.id,
        name: body.name,
        kind: body.kind,
        sort_order: sort_order,
        archived: false,
      },
    ])
    .select();

  // 6. HANDLE ERRORS
  if (insertError?.code === "23505") {
    // Unique constraint violation (duplicate name)
    return error("Category with that name already exists", 409);
  }

  if (insertError) {
    console.error("Database error:", insertError);
    return error("Failed to create category", 500);
  }

  // 7. RETURN 201 CREATED
  return Response.json(created[0], { status: 201 });
}
```

**Calling this endpoint:**

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "name": "Groceries",
    "kind": "expense"
  }'

# Response: 201 Created
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "user_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "name": "Groceries",
#   "kind": "expense",
#   "sort_order": 1,
#   "archived": false,
#   "created_at": "2026-02-25T14:32:15.123Z"
# }
```

### PATCH /api/categories/[id] (Update)

```ts
// web/app/api/categories/[id]/route.ts

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. AUTHENTICATE
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 2. EXTRACT ROUTE PARAMETER
  const { id } = await params; // id = "550e8400-e29b-41d4-a716-446655440000"

  // 3. PARSE REQUEST BODY (all fields optional)
  const body = await req.json();
  // Partial update: { name?: string, sort_order?: number, archived?: boolean }

  // 4. VALIDATE (only if provided)
  if (body.name !== undefined && !body.name.trim()) {
    return error("name cannot be empty", 400);
  }

  // 5. BUILD UPDATE OBJECT
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.archived !== undefined) updates.archived = body.archived;

  if (Object.keys(updates).length === 0) {
    return error("No fields to update", 400);
  }

  // 6. UPDATE IN DATABASE
  const { data: updated, error: updateError } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id) // Ensure user owns this category
    .select()
    .single();

  // 7. HANDLE ERRORS
  if (updateError?.code === "23505") {
    // Unique constraint violation (duplicate name)
    return error("Category with that name already exists", 409);
  }

  if (!updated) {
    return error("Category not found", 404);
  }

  if (updateError) {
    return error("Failed to update category", 500);
  }

  // 8. RETURN 200 OK
  return json(updated);
}
```

### DELETE /api/categories/[id] (Delete with Safety)

```ts
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. AUTHENTICATE
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 2. EXTRACT ID
  const { id } = await params;

  // 3. CHECK IF CATEGORY IS IN USE
  // Count how many non-deleted transactions reference this category
  const { data: txnCount, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
    .is("deleted_at", null); // Only count non-deleted

  if (countError) {
    return error("Failed to check usage", 500);
  }

  if ((txnCount?.length ?? 0) > 0) {
    // Category is in use, don't allow deletion
    return json(
      {
        error: "Cannot delete category in use",
        transaction_count: txnCount?.length ?? 0,
      },
      409, // Conflict
    );
  }

  // 4. DELETE CATEGORY
  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return error("Failed to delete category", 500);
  }

  // 5. RETURN 204 NO CONTENT
  return new NextResponse(null, { status: 204 });
}
```

---

## Plaid Integration

### Why Plaid?

Manual entry is tedious. Plaid lets users link bank accounts and auto-sync transactions.

### Plaid Flow (High Level)

```
1. User clicks "Link Bank Account"
   ↓
2. Frontend calls POST /api/plaid/link-token
   ← Returns Plaid Link token
   ↓
3. Frontend opens Plaid Link modal (JavaScript SDK)
   User selects bank & logs in securely (in Plaid's iframe, NOT our app)
   ↓
4. Plaid redirects with public_token
   ↓
5. Frontend calls POST /api/plaid/exchange-token with public_token
   Backend exchanges it for access_token (never seen by browser)
   Backend stores encrypted access_token in DB
   Backend fetches user's accounts from Plaid API
   Backend triggers initial transaction sync
   ↓
6. Frontend shows "Chase Checking linked successfully!"
```

### Code Example: exchange-token

```ts
// web/app/api/plaid/exchange-token/route.ts

import { plaidClient } from "@/lib/plaid/client";

export async function POST(req: NextRequest) {
  // 1. AUTHENTICATE
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 2. PARSE REQUEST
  const { public_token, institution_id, institution_name } = await req.json();

  if (!public_token) {
    return error("public_token required", 400);
  }

  // 3. EXCHANGE PUBLIC TOKEN FOR ACCESS TOKEN
  // This is done server-side (never exposed to browser)
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    client_id: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    public_token: public_token,
  });

  const access_token = exchangeResponse.data.access_token;
  const item_id = exchangeResponse.data.item_id; // Plaid's item ID

  // 4. STORE ACCESS TOKEN (encrypted in Supabase Vault)
  // For MVP/sandbox, we skip encryption and store plaintext
  const { data: plaidItem, error: insertError } = await supabase
    .from("plaid_items")
    .insert([
      {
        user_id: user.id,
        access_token: access_token, // In production: encrypt this
        institution_id: institution_id,
        institution_name: institution_name,
        sync_cursor: null,
        last_synced_at: null,
      },
    ])
    .select()
    .single();

  if (insertError?.code === "23505") {
    return error("Institution already linked", 409);
  }

  // 5. FETCH PLAID ACCOUNTS
  const accountsResponse = await plaidClient.accountsGet({
    access_token: access_token,
  });

  // 6. INSERT ACCOUNTS INTO OUR DATABASE
  const accounts = accountsResponse.data.accounts;
  for (const plaidAccount of accounts) {
    await supabase.from("accounts").insert([
      {
        user_id: user.id,
        plaid_item_id: plaidItem.id,
        name: plaidAccount.official_name || plaidAccount.name,
        type: plaidAccount.subtype,
        source: "plaid",
        currency: plaidAccount.balances.iso_currency_code || "USD",
        current_balance: plaidAccount.balances.current,
        balance_as_of: new Date().toISOString(),
      },
    ]);
  }

  // 7. KICK OFF INITIAL SYNC
  // Call our own /api/plaid/sync endpoint
  await fetch("http://localhost:3000/api/plaid/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}`, // Service token
    },
    body: JSON.stringify({
      plaid_item_id: plaidItem.id,
    }),
  });

  // 8. RETURN RESPONSE
  return created({
    plaid_item_id: plaidItem.id,
    accounts: accounts.map((acc) => ({
      id: acc.account_id,
      name: acc.name,
      type: acc.subtype,
      currency: acc.balances.iso_currency_code || "USD",
      current_balance: acc.balances.current,
    })),
  });
}
```

### Sync Handler: POST /api/plaid/sync

```ts
// web/app/api/plaid/sync/route.ts

export async function POST(req: NextRequest) {
  // 1. AUTHENTICATE
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 2. PARSE REQUEST
  const { plaid_item_id } = await req.json();

  // 3. FETCH PLAID ITEM FROM DB
  const { data: plaidItem, error: itemError } = await supabase
    .from("plaid_items")
    .select("*")
    .eq("id", plaid_item_id)
    .eq("user_id", user.id)
    .single();

  if (!plaidItem) {
    return error("Plaid item not found", 404);
  }

  // 4. INCREMENTAL SYNC (using cursor)
  const syncResponse = await plaidClient.transactionsSync({
    access_token: plaidItem.access_token,
    cursor: plaidItem.sync_cursor, // Start from last sync
  });

  const { added, modified, removed, next_cursor } = syncResponse.data;

  // 5. PROCESS ADDED TRANSACTIONS
  for (const txn of added) {
    // Get account
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("plaid_item_id", plaidItem.id)
      .eq("id", txn.account_id)
      .single();

    if (!account) continue;

    // Check for manual transaction conflict
    // (same account, similar date, similar amount)
    const { data: matchingTxn } = await supabase
      .from("transactions")
      .select("id")
      .eq("account_id", account.id)
      .eq("amount", -txn.amount) // Negate Plaid amount
      .gte("txn_date", dayjs(txn.date).subtract(2, "day").format("YYYY-MM-DD"))
      .lte("txn_date", dayjs(txn.date).add(2, "day").format("YYYY-MM-DD"))
      .eq("source", "manual")
      .is("needs_review", false)
      .limit(1);

    // Insert transaction
    await supabase.from("transactions").insert([
      {
        user_id: user.id,
        account_id: account.id,
        txn_date: txn.date,
        amount: -txn.amount, // ← Negate: Plaid positive = expense, app negative = expense
        amount_base: -txn.amount,
        currency: txn.iso_currency_code || "USD",
        merchant: txn.merchant_name,
        source: "plaid",
        plaid_transaction_id: txn.transaction_id,
        needs_review: !!matchingTxn, // ← Flag if manual conflict detected
        pending: txn.pending,
      },
    ]);

    if (matchingTxn) {
      // Also flag the manual transaction
      await supabase
        .from("transactions")
        .update({ needs_review: true })
        .eq("id", matchingTxn[0].id);
    }
  }

  // 6. UPDATE CURSOR
  await supabase
    .from("plaid_items")
    .update({
      sync_cursor: next_cursor,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", plaidItem.id);

  // 7. RETURN STATS
  return json({
    added: added.length,
    modified: modified.length,
    removed: removed.length,
    cursor: next_cursor,
  });
}
```

---

## Design Decisions

### 1. **Manual-First MVP, Plaid Later**

**Decision:** Build the app to work 100% without Plaid first, then add bank linking as an optional feature.

**Why:**

- ✅ Faster MVP (no Plaid integration needed first)
- ✅ Users can start tracking transactions immediately
- ✅ Plaid is an "accelerator", not core functionality
- ❌ Manual entry is slower, but 100% flexible

**Implementation:**

- Every transaction has `source: "manual" | "plaid"`
- Routes accept manual transactions via POST /api/transactions
- Accounts have `source: "manual" | "plaid"`
- Frontend can show toggle: "Add manually" vs "Link bank"

---

### 2. **Soft Deletes, Not Hard Deletes**

**Decision:** When user deletes a transaction, don't remove it from the database. Instead, set `deleted_at` timestamp.

**Why:**

- ✅ User can recover accidentally deleted transactions
- ✅ Audit trail (know what was deleted and when)
- ✅ No foreign key conflicts (if budget references it)
- ✅ Comply with regulations (financial data often must be retained)

**Implementation:**

```ts
// DELETE /api/transactions/[id]
await supabase.from("transactions").update({ deleted_at: now() }).eq("id", id);

// GET /api/transactions (always filter)
query = query.is("deleted_at", null); // Only return non-deleted
```

---

### 3. **Dedup Strategy for Plaid/Manual Conflicts**

**Decision:** When Plaid syncs and finds a manual transaction with the same details, flag both with `needs_review: true`. Let user resolve via UI.

**Why:**

- ✅ Prevents duplicate transactions when user manually enters + Plaid syncs
- ✅ User has visibility into the conflict
- ✅ User can choose: merge, keep both, or delete manual

**Implementation:**

```ts
// During Plaid sync, check for conflicts
const { data: matching } = await supabase
  .from("transactions")
  .select("id")
  .eq("account_id", account.id)
  .eq("amount", -txn.amount)  // Plaid amount negated
  .gte("txn_date", date - 2 days)
  .lte("txn_date", date + 2 days)
  .eq("source", "manual")
  .eq("needs_review", false);

if (matching) {
  // Flag both
  await supabase
    .from("transactions")
    .update({ needs_review: true })
    .eq("id", matching[0].id);

  // Flag the Plaid transaction too
  await supabase.from("transactions").insert({
    needs_review: true
  });
}
```

---

### 4. **Row-Level Security (RLS) at Database Level**

**Decision:** Implement user data isolation at the database layer, not in application code.

**Why:**

- ✅ Impossible for a bug in the app to leak data (default deny)
- ✅ Every query is automatically filtered (no chance of forgetting .eq("user_id", user.id))
- ✅ Works even if someone directly queries the database
- ✅ Supabase handles it automatically

**Implementation:**

```sql
-- Every table has this policy
CREATE POLICY "users_own_data"
  ON categories FOR ALL
  USING (auth.uid() = user_id);
```

---

### 5. **TypeScript Types from Supabase**

**Decision:** Let Supabase auto-generate TypeScript types from the database schema. Re-export them in `lib/db/types.ts`.

**Why:**

- ✅ Type definitions always match the database
- ✅ Auto-complete in your editor
- ✅ Catch type errors at compile time
- ❌ Need to regenerate types after migrations

**Implementation:**

```bash
# After migrations, regenerate types
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

### 6. **Session Cookies (Not Access Tokens in Headers)**

**Decision:** Store auth tokens in HttpOnly cookies, not in localStorage/headers.

**Why:**

- ✅ XSS attacks can't steal HttpOnly cookies
- ✅ Automatically included in every request (no manual header setup)
- ✅ Handles token rotation transparently

**Implementation:**

```ts
// lib/supabase/server.ts - reads cookies
const cookieStore = await cookies();
const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => cookieStore.getAll(),
    setAll: (cookies) =>
      cookies.forEach((c) => cookieStore.set(c.name, c.value, c.options)),
  },
});
```

---

### 7. **Budget Actuals Calculated Client-Side**

**Decision:** Instead of storing `actual_amount` on budget_lines, calculate it on-the-fly from transactions.

**Why:**

- ✅ No sync issues (actual always up-to-date)
- ✅ Simpler schema (no redundant data)
- ✅ Query is fast (filter by month + user_id)

**Implementation:**

```ts
// GET /api/budgets?month=2026-02
const month = "2026-02";
const startDate = `${month}-01`;
const endDate = dayjs(month).endOf("month").format("YYYY-MM-DD");

// Fetch all transactions for the month
const { data: txns } = await supabase
  .from("transactions")
  .select("category_id, amount")
  .gte("txn_date", startDate)
  .lte("txn_date", endDate)
  .is("deleted_at", null);

// Group by category and sum (in JavaScript)
const actuals = {};
txns.forEach((txn) => {
  if (!actuals[txn.category_id]) actuals[txn.category_id] = 0;
  actuals[txn.category_id] += Math.abs(txn.amount); // Use Math.abs for expenses
});
```

---

## Summary

**Charlie is a three-tier full-stack app:**

1. **Frontend** (React + Next.js) - NOT BUILT YET

   - User interface
   - Form handling
   - Data fetching with TanStack Query

2. **Backend** (Next.js API Routes) - BUILT ✅

   - 16 REST endpoints
   - Authentication
   - Business logic
   - Database queries

3. **Database** (Supabase PostgreSQL) - BUILT ✅
   - 8 tables with RLS
   - Seed data for testing
   - Migrations for schema versioning

**Key architecture patterns:**

- ✅ SSR-friendly authentication with HttpOnly cookies
- ✅ Row-Level Security for data isolation
- ✅ Soft deletes for audit trails
- ✅ Dedup strategy for Plaid/manual conflicts
- ✅ Type-safe queries with auto-generated types
- ✅ Manual-first MVP, Plaid linking optional

**Ready to explain to a recruiter/senior engineer:**

_"Charlie is a personal finance web app built with Next.js, React, and Supabase. The backend consists of 16 REST API routes that handle categories, accounts, transactions, budgets, and Plaid bank linking. Authentication uses Supabase's session-based auth with HttpOnly cookies, and data isolation is enforced at the database level using Row-Level Security policies. The frontend (currently being built) will fetch data from these routes and render budgets, transaction lists, and charts. The app prioritizes security (RLS prevents data leaks), scalability (Supabase handles DB scaling), and user flexibility (manual entry + optional Plaid integration)."_
