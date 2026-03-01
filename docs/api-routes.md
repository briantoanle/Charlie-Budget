# API Routes

All routes live under `app/api/` using the Next.js App Router convention (`route.ts` files).

## Conventions

| Convention | Detail |
|---|---|
| Auth | Supabase session cookie — SSR middleware rejects unauthenticated requests with `401` |
| Content-Type | `application/json` unless noted (export route returns file) |
| Success | `200 OK` with JSON body; `201 Created` for new resources |
| No content | `204 No Content` for deletes |
| Errors | `{ "error": string }` with appropriate HTTP status |
| IDs | UUIDs |
| Dates | `YYYY-MM-DD` for calendar dates; ISO 8601 for timestamps |
| Amounts | Decimal numbers in the account's native currency (e.g. `42.50`) — negative = expense, positive = income |

---

## Table of Contents

- [Plaid](#plaid)
- [Accounts](#accounts)
- [Transactions](#transactions)
- [Categories](#categories)
- [Budgets](#budgets)
- [Reports](#reports)
- [Investments](#investments)
- [Settings](#settings)

---

## Plaid

### `POST /api/plaid/link-token`

Creates a Plaid Link token to open the Plaid Link modal in the browser.

**Request body**
```json
{
  "mode": "create" | "update",
  "plaid_item_id": "uuid"   // required when mode = "update"
}
```

**Response**
```json
{
  "link_token": "link-sandbox-..."
}
```

**Errors**
| Status | Reason |
|---|---|
| `400` | `plaid_item_id` missing when `mode = "update"` |
| `500` | Plaid API error |

**Notes:** Token expires after 30 minutes. Used client-side only to initialise Plaid Link — never stored.

---

### `POST /api/plaid/exchange-token`

Exchanges a Plaid `public_token` for an `access_token`, encrypts and stores it in `plaid_items` via Supabase Vault, fetches accounts from Plaid, and kicks off an initial transaction sync.

**Request body**
```json
{
  "public_token": "public-sandbox-...",
  "institution_id": "ins_123",
  "institution_name": "Chase"
}
```

**Response**
```json
{
  "plaid_item_id": "uuid",
  "accounts": [
    {
      "id": "uuid",
      "name": "Checking ••4242",
      "type": "checking",
      "currency": "USD",
      "current_balance": 1234.56
    }
  ]
}
```

**Errors**
| Status | Reason |
|---|---|
| `400` | Invalid `public_token` |
| `409` | Institution already linked by this user |
| `500` | Plaid API error or Vault encryption failure |

**Notes:** Access token is never returned to the client. Writes to `audit_log`.

---

### `POST /api/plaid/sync`

Triggers an incremental transaction sync for a specific Plaid item using the stored cursor.

**Request body**
```json
{
  "plaid_item_id": "uuid"
}
```

**Response**
```json
{
  "added": 12,
  "modified": 2,
  "removed": 0,
  "cursor": "updated-cursor-string"
}
```

**Errors**
| Status | Reason |
|---|---|
| `404` | `plaid_item_id` not found |
| `403` | Item belongs to a different user |
| `500` | Plaid API error |

**Notes:** Called automatically after `exchange-token`. Can also be triggered manually from Settings → Connected Accounts → Sync now, or by the webhook handler.

---

### `POST /api/plaid/webhook`

Receives and processes Plaid webhook events. **Not authenticated via Supabase session** — verified by Plaid JWT signature instead.

**Request body:** Plaid webhook payload (shape varies by event).

**Handled events**
| Plaid event | Action |
|---|---|
| `TRANSACTIONS_SYNC_UPDATES_AVAILABLE` | Call `/api/plaid/sync` for the item |
| `ITEM_LOGIN_REQUIRED` | Set `plaid_items.needs_reauth = true` |
| `ITEM_REMOVED` | Archive item + associated accounts |

**Response:** Always `200 OK` — Plaid retries on any non-200.

**Errors**
| Status | Reason |
|---|---|
| `400` | Invalid JWT signature — request is silently dropped |

---

## Accounts

### `GET /api/accounts`

Returns all non-archived accounts for the authenticated user, joined with Plaid item metadata.

**Response**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Chase Checking",
      "type": "checking",
      "source": "plaid",
      "currency": "USD",
      "current_balance": 4210.00,
      "balance_as_of": "2026-02-25T18:00:00Z",
      "plaid_item_id": "uuid",
      "institution_name": "Chase",
      "needs_reauth": false,
      "last_synced_at": "2026-02-25T18:00:00Z",
      "archived": false,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Notes:** Joins `plaid_items` for `institution_name`, `needs_reauth`, and `last_synced_at`. Manual accounts (`source = "manual"`) have `null` for all Plaid fields.

---

### `POST /api/accounts`

Creates a manual account (not linked to Plaid).

**Request body**
```json
{
  "name": "Main Checking",
  "type": "checking",
  "currency": "USD",
  "current_balance": 4250.00
}
```

| Field | Required | Default |
|---|---|---|
| `name` | Yes | — |
| `type` | Yes | — |
| `currency` | No | `"USD"` |
| `current_balance` | No | `null` |

**Response:** `201` + created account object with `source: "manual"`.

**Errors**
| Status | Reason |
|---|---|
| `400` | `name` or `type` missing |

---

### `PATCH /api/accounts/[id]`

Updates user-editable fields on an account.

**Request body** *(all fields optional)*
```json
{
  "name": "My Checking",
  "archived": true
}
```

**Response:** Updated account object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Account not found |
| `403` | Account belongs to a different user |

---

### `DELETE /api/accounts/[id]`

Disconnects a Plaid-linked account: revokes the Plaid access token, removes the `plaid_items` row, and soft-deletes all associated transactions.

**Response:** `204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `404` | Account not found |
| `403` | Account belongs to a different user |
| `500` | Plaid token revocation error |

**Notes:** Always confirm in the UI before calling. Writes to `audit_log`.

---

## Transactions

### `GET /api/transactions`

Returns a paginated, filterable list of transactions for the authenticated user.

**Query params**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number, 1-indexed |
| `per_page` | number | `50` | Results per page (max: `200`) |
| `account_id` | uuid | — | Filter by account |
| `category_id` | uuid or `"uncategorized"` | — | Filter by category; use `"uncategorized"` for null |
| `start_date` | YYYY-MM-DD | — | Inclusive lower bound on `txn_date` |
| `end_date` | YYYY-MM-DD | — | Inclusive upper bound on `txn_date` |
| `search` | string | — | Full-text search against `merchant` and `note` |
| `pending` | boolean | — | Filter pending / settled transactions |

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "txn_date": "2026-02-20",
      "amount": -52.40,
      "amount_base": -52.40,
      "currency": "USD",
      "merchant": "Whole Foods",
      "note": null,
      "pending": false,
      "source": "plaid",
      "category_id": "uuid",
      "category_name": "Groceries",
      "account_id": "uuid",
      "account_name": "Chase Checking"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 312
  }
}
```

**Notes:** Excludes soft-deleted rows (`deleted_at IS NULL`). Joins `categories` and `accounts` for display names.

---

### `POST /api/transactions`

Creates a manual transaction (not synced from Plaid).

**Request body**
```json
{
  "account_id": "uuid",
  "txn_date": "2026-02-25",
  "amount": -52.40,
  "category_id": "uuid",
  "merchant": "Whole Foods",
  "note": "Weekly groceries",
  "currency": "USD"
}
```

| Field | Required | Default |
|---|---|---|
| `account_id` | Yes | — |
| `txn_date` | Yes | — |
| `amount` | Yes | — |
| `category_id` | No | `null` |
| `merchant` | No | `null` |
| `note` | No | `null` |
| `currency` | No | `"USD"` |

**Response:** `201` + created transaction object with `source: "manual"`.

**Errors**
| Status | Reason |
|---|---|
| `400` | `account_id`, `txn_date`, or `amount` missing |
| `404` | Account not found |

**Notes:** `amount_base` is set equal to `amount` (same currency assumed for MVP). `pending` defaults to `false`.

---

### `PATCH /api/transactions/[id]`

Updates user-editable fields on a single transaction.

**Request body** *(all fields optional)*
```json
{
  "category_id": "uuid",
  "note": "Team lunch"
}
```

**Response:** Updated transaction object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Transaction not found |
| `403` | Transaction belongs to a different user |

---

### `DELETE /api/transactions/[id]`

Soft-deletes a transaction by setting `deleted_at`.

**Response:** `204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `404` | Transaction not found |
| `403` | Transaction belongs to a different user |

---

### `PATCH /api/transactions/bulk`

Applies a single action to multiple transactions at once.

**Request body**
```json
{
  "ids": ["uuid", "uuid"],
  "action": "recategorize" | "delete",
  "category_id": "uuid"   // required when action = "recategorize"
}
```

**Response**
```json
{
  "updated": 5
}
```

**Errors**
| Status | Reason |
|---|---|
| `400` | `category_id` missing when `action = "recategorize"` |
| `403` | Any ID in the list belongs to a different user — entire request rejected |

---

## Categories

### `GET /api/categories`

Returns all categories for the user, ordered by `sort_order`.

**Query params**
| Param | Type | Default | Description |
|---|---|---|---|
| `include_archived` | boolean | `false` | Include archived categories |

**Response**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Groceries",
      "kind": "expense",
      "sort_order": 1,
      "archived": false,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/categories`

Creates a new category.

**Request body**
```json
{
  "name": "Groceries",
  "kind": "expense" | "income" | "transfer",
  "sort_order": 5   // optional; appended to end if omitted
}
```

**Response:** `201` + created category object.

**Errors**
| Status | Reason |
|---|---|
| `400` | `name` or `kind` missing |
| `409` | A category with that name already exists for this user |

---

### `PATCH /api/categories/[id]`

Updates a category.

**Request body** *(all fields optional)*
```json
{
  "name": "Food & Drink",
  "sort_order": 2,
  "archived": true
}
```

**Response:** Updated category object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Category not found |
| `403` | Category belongs to a different user |
| `409` | Name conflicts with an existing category |

---

### `DELETE /api/categories/[id]`

Permanently deletes a category. Blocked if any non-deleted transactions reference it.

**Response:** `204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `404` | Category not found |
| `403` | Category belongs to a different user |
| `409` | Category is in use — response includes `{ "error": "...", "transaction_count": 14 }` |

---

## Budgets

### `GET /api/budgets`

Returns the budget for a given month with all lines and actuals calculated.

**Query params**
| Param | Type | Description |
|---|---|---|
| `month` | YYYY-MM | **Required.** Month to fetch. |

**Response**
```json
{
  "budget": {
    "id": "uuid",
    "month": "2026-02-01",
    "created_at": "2026-01-28T00:00:00Z",
    "lines": [
      {
        "id": "uuid",
        "category_id": "uuid",
        "category_name": "Groceries",
        "planned_amount": 600.00,
        "actual_amount": 420.50
      }
    ],
    "totals": {
      "planned": 3200.00,
      "actual": 2810.75
    }
  }
}
```

**Notes:** `budget: null` if no budget exists for that month. `actual_amount` is summed from non-deleted transactions within that calendar month for each category.

---

### `POST /api/budgets`

Creates a new empty budget for a month.

**Request body**
```json
{
  "month": "2026-03"
}
```

**Response:** `201` + budget object with an empty `lines` array.

**Errors**
| Status | Reason |
|---|---|
| `400` | Invalid or missing `month` |
| `409` | A budget already exists for that month |

---

### `POST /api/budgets/copy`

Copies all budget lines from a source month into a new budget for the target month.

**Request body**
```json
{
  "source_month": "2026-02",
  "target_month": "2026-03"
}
```

**Response:** `201` + new budget object with copied lines.

**Errors**
| Status | Reason |
|---|---|
| `404` | No budget found for `source_month` |
| `409` | A budget already exists for `target_month` |

---

### `POST /api/budgets/[id]/lines`

Adds a category line to an existing budget.

**Request body**
```json
{
  "category_id": "uuid",
  "planned_amount": 200.00
}
```

**Response:** `201` + created budget line object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Budget not found |
| `409` | That category already has a line in this budget |

---

### `PATCH /api/budgets/[id]/lines/[lineId]`

Updates the planned amount for a budget line.

**Request body**
```json
{
  "planned_amount": 350.00
}
```

**Response:** Updated budget line object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Budget or line not found |
| `403` | Budget belongs to a different user |

---

### `DELETE /api/budgets/[id]/lines/[lineId]`

Removes a line from a budget.

**Response:** `204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `404` | Budget or line not found |
| `403` | Budget belongs to a different user |

---

## Reports

> Reports are read-only aggregation queries. All amounts returned in the user's `base_currency` using `amount_base`.

### `GET /api/reports/monthly-trend`

Returns month-by-month income, spending, and net cashflow.

**Query params**
| Param | Type | Default | Description |
|---|---|---|---|
| `months` | number | `12` | How many months to look back (max: `24`) |

**Response**
```json
{
  "data": [
    {
      "month": "2026-02",
      "income": 5000.00,
      "spending": 2810.75,
      "net": 2189.25
    }
  ]
}
```

**Notes:** Ordered oldest → newest. Excludes pending and soft-deleted transactions.

---

### `GET /api/reports/category-breakdown`

Returns total spending (or income) per category over a date range.

**Query params**
| Param | Type | Description |
|---|---|---|
| `start_date` | YYYY-MM-DD | **Required.** |
| `end_date` | YYYY-MM-DD | **Required.** |
| `kind` | `expense` \| `income` | Category kind to aggregate (default: `expense`) |

**Response**
```json
{
  "data": [
    {
      "category_id": "uuid",
      "category_name": "Groceries",
      "total": 1240.50,
      "percentage": 22.4
    }
  ],
  "grand_total": 5534.25
}
```

**Notes:** Uncategorised transactions are grouped under `{ "category_id": null, "category_name": "Uncategorized" }`. Ordered by `total` descending.

---

## Investments

> Investment data is manually entered (no Plaid integration). Market price provider is TBD (Polygon.io / Alpha Vantage).

### `GET /api/investments/accounts`

Returns all investment accounts for the user.

**Response**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Fidelity IRA",
      "broker": "Fidelity",
      "currency": "USD",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/investments/accounts`

Creates an investment account.

**Request body**
```json
{
  "name": "Fidelity IRA",
  "broker": "Fidelity",
  "currency": "USD"
}
```

**Response:** `201` + created account object.

**Errors**
| Status | Reason |
|---|---|
| `400` | `name` or `currency` missing |

---

### `PATCH /api/investments/accounts/[id]`

Updates an investment account.

**Request body** *(all fields optional)*
```json
{
  "name": "Fidelity Roth IRA",
  "broker": "Fidelity"
}
```

**Response:** Updated account object.

**Errors**
| Status | Reason |
|---|---|
| `404` | Account not found |
| `403` | Account belongs to a different user |

---

### `GET /api/investments/holdings`

Returns current holdings with live market price and unrealised P&L.

**Query params**
| Param | Type | Description |
|---|---|---|
| `account_id` | uuid | Filter by investment account (optional) |

**Response**
```json
{
  "holdings": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "quantity": 10,
      "avg_cost": 150.00,
      "current_price": 228.50,
      "market_value": 2285.00,
      "unrealized_pnl": 785.00,
      "unrealized_pnl_pct": 52.33,
      "account_id": "uuid"
    }
  ]
}
```

**Notes:** `current_price` is fetched live from the market data API and cached per ticker per calendar day.

---

### `GET /api/investments/trades`

Returns trade history.

**Query params**
| Param | Type | Description |
|---|---|---|
| `account_id` | uuid | Filter by investment account (optional) |
| `ticker` | string | Filter by ticker symbol (optional) |

**Response**
```json
{
  "trades": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "side": "buy" | "sell",
      "quantity": 5,
      "price": 150.00,
      "total": 750.00,
      "trade_date": "2024-06-15",
      "account_id": "uuid"
    }
  ]
}
```

---

### `POST /api/investments/trades`

Logs a buy or sell trade and recalculates the holding's `avg_cost` and `quantity`.

**Request body**
```json
{
  "account_id": "uuid",
  "ticker": "AAPL",
  "side": "buy" | "sell",
  "quantity": 5,
  "price": 150.00,
  "trade_date": "2024-06-15"
}
```

**Response:** `201` + trade object and updated holding snapshot.

**Errors**
| Status | Reason |
|---|---|
| `400` | Sell quantity exceeds current held quantity |
| `404` | Investment account not found |
| `403` | Account belongs to a different user |

**Notes:** `avg_cost` is recalculated using weighted average on buys. A sell only reduces `quantity` — `avg_cost` is unchanged.

---

### `GET /api/investments/dividends`

Returns dividend history.

**Query params**
| Param | Type | Description |
|---|---|---|
| `account_id` | uuid | Filter by investment account (optional) |
| `ticker` | string | Filter by ticker symbol (optional) |

**Response**
```json
{
  "dividends": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "amount": 23.50,
      "per_share": 0.25,
      "ex_date": "2024-08-09",
      "pay_date": "2024-08-15",
      "account_id": "uuid"
    }
  ]
}
```

---

### `POST /api/investments/dividends`

Logs a dividend payment.

**Request body**
```json
{
  "account_id": "uuid",
  "ticker": "AAPL",
  "amount": 23.50,
  "per_share": 0.25,
  "ex_date": "2024-08-09",
  "pay_date": "2024-08-15"
}
```

**Response:** `201` + dividend object.

**Errors**
| Status | Reason |
|---|---|
| `400` | `account_id`, `ticker`, or `amount` missing |
| `404` | Investment account not found |

---

## Settings

### `GET /api/settings`

Returns the user's profile and preferences.

**Response**
```json
{
  "profile": {
    "id": "uuid",
    "display_name": "Toan",
    "base_currency": "USD",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### `PATCH /api/settings/profile`

Updates the user's display name.

**Request body**
```json
{
  "display_name": "Toan"
}
```

**Response:** Updated profile object.

**Errors**
| Status | Reason |
|---|---|
| `400` | `display_name` is empty or exceeds 100 characters |

---

### `POST /api/settings/currency`

Changes the user's base currency and recalculates `amount_base` on all transactions using historical FX rates.

**Request body**
```json
{
  "currency": "EUR"
}
```

**Response**
```json
{
  "currency": "EUR",
  "transactions_updated": 312
}
```

**Errors**
| Status | Reason |
|---|---|
| `400` | Unsupported or invalid currency code |
| `500` | Open Exchange Rates API error |

**Notes:** Fetches historical rates per `(txn_date, currency)` pair, caches results in `fx_rates`. For users with large transaction histories this may take a few seconds — consider a loading state. See [Currency Change flow](frontend-flow.md#8-currency-change).

---

### `POST /api/settings/export`

Exports all user data as a downloadable file.

**Request body**
```json
{
  "format": "csv" | "json"
}
```

**Response:** File download via `Content-Disposition: attachment`.

| Format | Content-Type | Contents |
|---|---|---|
| `csv` | `text/csv` | Transactions with all fields |
| `json` | `application/json` | Full export: accounts, transactions, categories, budgets |

**Errors**
| Status | Reason |
|---|---|
| `400` | Invalid `format` value |

---

### `DELETE /api/settings/account`

Permanently deletes the account: revokes all Plaid tokens, wipes all user data, and signs out.

**Request body**
```json
{
  "confirm": "DELETE"
}
```

**Response:** `204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `400` | `confirm` string does not exactly match `"DELETE"` |

**Notes:** Writes a final entry to `audit_log` before deletion. Irreversible. Client should sign out and redirect to `/` on success. Writes to `audit_log`.
