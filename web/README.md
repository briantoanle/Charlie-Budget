# Charlie Budget — Web Frontend

Personal budgeting and investment tracking app built with Next.js 16 (App Router).

## Quick Start

```bash
# From repo root:
npx supabase start          # Start local Supabase (Docker required)
npx supabase db reset       # Apply migrations + seed data

cd web
cp .env.local.example .env.local   # Fill in Supabase keys
npm install
npm run dev                 # → http://localhost:3000
```

**Test login:** `test@charlie.com` / `password123`

---

## Tech Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)        |
| UI        | shadcn/ui + Tailwind CSS v4               |
| Data      | TanStack Query v5 (queries + mutations)   |
| Auth & DB | Supabase (PostgreSQL + RLS)               |
| Banking   | Plaid (account linking, transaction sync) |

## Design System

**Aesthetic**: Industrial Utilitarian — dense information, restrained palette, precise typography.

| Token        | Value          | Usage                                 |
| ------------ | -------------- | ------------------------------------- |
| Display font | DM Sans        | Headings, labels, UI text             |
| Mono font    | JetBrains Mono | Financial amounts, tabular data       |
| Background   | `#0F1117`      | Deep charcoal                         |
| Accent       | `#8B9A6B`      | Olive — positive values, income       |
| Destructive  | `#E07A5F`      | Coral — expenses, alerts, over-budget |

## Project Structure

```
web/
├── app/
│   ├── (auth)/          # Login, Signup, Forgot Password
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (app)/           # Authenticated app shell
│   │   ├── dashboard/   # Net worth, cashflow, recent txns
│   │   ├── accounts/    # Bank accounts + Plaid Link
│   │   ├── transactions/# Search, filter, paginate
│   │   ├── categories/  # CRUD (create, rename, archive, delete)
│   │   ├── budgets/     # Month navigator, lines, progress bars
│   │   ├── reports/     # Cashflow trend, category breakdown
│   │   ├── investments/ # (Phase 3 stub)
│   │   └── settings/    # (Phase 3 stub)
│   ├── api/             # Route handlers (see docs/api-routes.md)
│   └── layout.tsx       # Root layout (fonts, providers)
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── dashboard/       # Balance card, cashflow card, recent txns
│   ├── accounts/        # Account card, Plaid Link button
│   ├── transactions/    # Table, filters
│   └── app-sidebar.tsx  # Navigation sidebar
├── lib/
│   ├── api/hooks.ts     # TanStack Query hooks (10 queries + mutations)
│   ├── actions/auth.ts  # Server Actions (login, signup, forgot-pw)
│   └── supabase/        # Client + server Supabase instances
└── proxy.ts             # Auth protection for (app) routes (Next.js 16)
```

## Build Status

| Phase                     | Status     | Features                                              |
| ------------------------- | ---------- | ----------------------------------------------------- |
| 1. Foundation             | ✅ Done    | Auth flow, sidebar, Dashboard, Accounts, Transactions |
| 2. Budgets & Reports      | ✅ Done    | Categories CRUD, Budget lines + progress, Reports     |
| 3. Investments & Settings | 🔲 Planned | Holdings, DRIP, profile settings                      |
| 4. Polish                 | 🔲 Planned | Responsive, a11y, SEO metadata                        |

## Available Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build (catches TS errors)
npm run lint      # ESLint
npm run start     # Serve production build
npm run test:e2e  # Playwright E2E (reuses saved login)
```

Before running E2E tests, set the credentials in `.env.local`:

```bash
E2E_SUPABASE_EMAIL=test@charlie.com
E2E_SUPABASE_PASSWORD=password123
```

## Docs

See the parent [README](../README.md) for full architecture, security details, and DB schema.

| Doc                                               | Contents               |
| ------------------------------------------------- | ---------------------- |
| [docs/api-routes.md](../docs/api-routes.md)       | All API endpoints      |
| [docs/frontend-flow.md](../docs/frontend-flow.md) | User flows per feature |
| [docs/db-schema.md](../docs/db-schema.md)         | Full ERD               |
