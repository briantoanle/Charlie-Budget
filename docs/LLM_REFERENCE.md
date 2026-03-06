# Charlie Budget - LLM Codebase Reference

This document serves as the definitive source of truth for AI assistants and LLMs to understand the repository structure, architecture, and design patterns of the **Charlie Budget** application.

## 1. High-Level Architecture

Charlie Budget is a monolithic Next.js App Router application that handles both frontend React components and backend API route handlers. It uses Supabase for the database, authentication, and Row-Level Security (RLS). Plaid is integrated for bank account syncing.

**Stack Summary**:

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS v4, shadcn/ui.
- **State/Data Fetching**: TanStack Query v5 (client-side), React Server Components (server-side).
- **Backend**: Next.js API Routes (`app/api/...`).
- **Database/Auth**: Supabase (PostgreSQL, GoTrue for Auth, RLS policies).
- **External APIs**: Plaid (banking), Open Exchange Rates (currency).

## 2. Directory Structure Mapping

### `/web` (Primary Application Code)

The entire application logic resides here.

- `app/`: Next.js App Router root.
  - `(app)/`: Authenticated routes (Dashboard, Accounts, Transactions, etc.).
  - `(auth)/`: Unauthenticated routes (Login, Signup, Forgot Password).
  - `api/`: Next.js Route Handlers (Backend APIs).
- `components/`: Reusable React components.
  - `ui/`: shadcn/ui base components.
  - `dashboard/`, `accounts/`, `transactions/`: Feature-specific components.
- `lib/`: Core libraries and utilities.
  - `api/`: Client-side fetch wrappers for TanStack Query.
  - `db/`: Database abstractions and types.
  - `supabase/`: Supabase client initializers (server, client, middleware).
  - `plaid/`: Plaid API clients and webhook handlers.
- `hooks/`: Custom React hooks (e.g., TanStack Query hooks).
- `tests/`: End-to-end and integration tests.

### `/supabase` (Database & Infrastructure)

- `migrations/`: Sequential SQL migration files defining the schema and RLS policies.
- `seed.sql`: Synthetic data for local development and testing.
- `config.toml`: Supabase local configuration.

### `/docs` (Detailed Documentation)

- `ARCHITECTURE.md`: Deep dive into architectural decisions and data flows.
- `api-routes.md`: Exhaustive list of all internal REST API endpoints.
- `db-schema.md`: Database schema diagrams and table descriptions.
- `frontend-flow.md`: UI and user journey mappings.

## 3. Key Design Patterns

### Authentication & RLS

- **Never trust the client**: All data access is mediated through Supabase RLS. The `user_id` is automatically derived from the authenticated session.
- **Middleware**: `web/middleware.ts` protects `(app)` routes by verifying the Supabase session before rendering.

### Data Fetching

- **Server Components**: Used for initial data loads or SEO-critical pages (mostly shell).
- **Client Components + TanStack Query**: Used for highly interactive data (Transactions, Dashboard charts). API calls hit `/api/*` which then query Supabase securely.

### API Route Standards (`web/app/api/...`)

- All API routes use a consistent error wrapping mechanism.
- Handlers extract the user session via `@supabase/auth-helpers-nextjs` or `@supabase/ssr` before performing operations.
- Direct database calls from API routes bypass RLS _only if_ using a service role key (rare, e.g., Plaid webhooks), otherwise they use the user's secure client.

## 4. Where to Make Changes

| Goal                   | Where to go                                              |
| ---------------------- | -------------------------------------------------------- |
| Add a new UI page      | `web/app/(app)/[feature]/page.tsx`                       |
| Add an API endpoint    | `web/app/api/[feature]/route.ts`                         |
| Modify Database Schema | `supabase/migrations/[timestamp]_new_feature.sql`        |
| Add a UI Component     | `web/components/[feature]/MyComponent.tsx`               |
| Add Client Data Fetch  | `web/hooks/use[Feature].ts` & `web/lib/api/[feature].ts` |

## 5. Security & Constraints

- **Plaid Tokens**: `access_token` is encrypted in Supabase Vault. NEVER return it to the frontend.
- **Environment Variables**: Use `.env.local`. Ensure `NEXT_PUBLIC_` is only used for safe, client-side exposed variables.
- **Type Safety**: Generate Supabase types using the CLI after migrations to keep TypeScript happy.

_For deep dives into specific subsystems, consult the individual markdown files in the `/docs` directory._
