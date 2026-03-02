"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ────────────────────────────────────────────────────────────────── */
/*  Generic helpers                                                   */
/* ────────────────────────────────────────────────────────────────── */

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiMutate<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/* ────────────────────────────────────────────────────────────────── */
/*  Types (matching API response shapes from docs/api-routes.md)     */
/* ────────────────────────────────────────────────────────────────── */

export interface AccountResponse {
  id: string;
  name: string;
  type: string;
  source: string;
  currency: string;
  current_balance: number | null;
  balance_as_of: string | null;
  plaid_item_id: string | null;
  institution_name: string | null;
  needs_reauth: boolean;
  last_synced_at: string | null;
  archived: boolean;
  created_at: string;
}

export interface TransactionResponse {
  id: string;
  txn_date: string;
  amount: number;
  amount_base: number;
  currency: string;
  merchant: string | null;
  note: string | null;
  pending: boolean;
  source: string;
  category_id: string | null;
  category_name: string | null;
  account_id: string;
  account_name: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  kind: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface BudgetLineResponse {
  id: string;
  category_id: string;
  category_name: string;
  planned_amount: number;
  actual_amount: number;
}

export interface BudgetResponse {
  id: string;
  month: string;
  created_at: string;
  lines: BudgetLineResponse[];
  totals: {
    planned: number;
    actual: number;
  };
}

export interface TransactionPagination {
  page: number;
  per_page: number;
  total: number;
}

export interface MonthlyTrendPoint {
  month: string;
  income: number;
  spending: number;
  net: number;
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total: number;
  percentage: number;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Query Hooks                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      apiFetch<{ accounts: AccountResponse[] }>("/api/accounts").then(
        (r) => r.accounts
      ),
  });
}

export function useTransactions(params: {
  page?: number;
  per_page?: number;
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") {
      searchParams.set(key, String(val));
    }
  });

  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () =>
      apiFetch<{
        data: TransactionResponse[];
        pagination: TransactionPagination;
      }>(`/api/transactions?${searchParams.toString()}`),
  });
}

export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: ["categories", { includeArchived }],
    queryFn: () =>
      apiFetch<{ categories: CategoryResponse[] }>(
        `/api/categories${includeArchived ? "?include_archived=true" : ""}`
      ).then((r) => r.categories),
  });
}

export function useBudget(month: string) {
  return useQuery({
    queryKey: ["budget", month],
    queryFn: () =>
      apiFetch<{ budget: BudgetResponse | null }>(
        `/api/budgets?month=${month}`
      ).then((r) => r.budget),
    enabled: !!month,
  });
}

export function useMonthlyTrend(months = 12) {
  return useQuery({
    queryKey: ["reports", "monthly-trend", months],
    queryFn: () =>
      apiFetch<{ data: MonthlyTrendPoint[] }>(
        `/api/reports/monthly-trend?months=${months}`
      ).then((r) => r.data),
    retry: false,
  });
}

export function useCategoryBreakdown(params: {
  start_date: string;
  end_date: string;
  kind?: string;
}) {
  const sp = new URLSearchParams();
  sp.set("start_date", params.start_date);
  sp.set("end_date", params.end_date);
  if (params.kind) sp.set("kind", params.kind);

  return useQuery({
    queryKey: ["reports", "category-breakdown", params],
    queryFn: () =>
      apiFetch<{ data: CategoryBreakdownItem[]; grand_total: number }>(
        `/api/reports/category-breakdown?${sp.toString()}`
      ),
    enabled: !!params.start_date && !!params.end_date,
    retry: false,
  });
}

/* ────────────────────────────────────────────────────────────────── */
/*  Mutation Hooks                                                    */
/* ────────────────────────────────────────────────────────────────── */

// ── Categories ──────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; kind: string; sort_order?: number }) =>
      apiMutate<CategoryResponse>("/api/categories", "POST", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      sort_order?: number;
      archived?: boolean;
    }) => apiMutate<CategoryResponse>(`/api/categories/${id}`, "PATCH", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiMutate<void>(`/api/categories/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ── Budgets ─────────────────────────────────────────────────────────

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: string }) =>
      apiMutate<BudgetResponse>("/api/budgets", "POST", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useCopyBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { source_month: string; target_month: string }) =>
      apiMutate<BudgetResponse>("/api/budgets/copy", "POST", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useAddBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      ...data
    }: {
      budgetId: string;
      category_id: string;
      planned_amount: number;
    }) =>
      apiMutate<BudgetLineResponse>(
        `/api/budgets/${budgetId}/lines`,
        "POST",
        data
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useUpdateBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      lineId,
      planned_amount,
    }: {
      budgetId: string;
      lineId: string;
      planned_amount: number;
    }) =>
      apiMutate<BudgetLineResponse>(
        `/api/budgets/${budgetId}/lines/${lineId}`,
        "PATCH",
        { planned_amount }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useDeleteBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      lineId,
    }: {
      budgetId: string;
      lineId: string;
    }) =>
      apiMutate<void>(`/api/budgets/${budgetId}/lines/${lineId}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

/* ────────────────────────────────────────────────────────────────── */
/*  Settings                                                          */
/* ────────────────────────────────────────────────────────────────── */

export interface ProfileResponse {
  id: string;
  display_name: string;
  base_currency: string;
  created_at: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetch<{ profile: ProfileResponse }>("/api/settings").then(
        (r) => r.profile
      ),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { display_name: string }) =>
      apiMutate<ProfileResponse>("/api/settings/profile", "PATCH", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { currency: string }) =>
      apiMutate<{ base_currency: string }>(
        "/api/settings/currency",
        "POST",
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useSyncPlaidItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { plaid_item_id: string }) =>
      apiMutate<{ added: number; modified: number; removed: number }>(
        "/api/plaid/sync",
        "POST",
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiMutate<void>(`/api/accounts/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteUserAccount() {
  return useMutation({
    mutationFn: () =>
      apiMutate<void>("/api/settings/account", "DELETE", {
        confirm: "DELETE",
      }),
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async (format: "csv" | "json") => {
      const res = await fetch("/api/settings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      // Trigger file download
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] ?? `charlie-export.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}

/* ────────────────────────────────────────────────────────────────── */
/*  Investments                                                       */
/* ────────────────────────────────────────────────────────────────── */

export interface InvestmentAccountResponse {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
  created_at: string;
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  account_id: string;
}

export interface TradeResponse {
  id: string;
  ticker: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  trade_date: string;
  account_id: string;
  created_at: string;
}

export interface DividendResponse {
  id: string;
  ticker: string;
  amount: number;
  per_share: number | null;
  ex_date: string | null;
  pay_date: string | null;
  account_id: string;
  created_at: string;
}

export function useInvestmentAccounts() {
  return useQuery({
    queryKey: ["investment-accounts"],
    queryFn: () =>
      apiFetch<{ accounts: InvestmentAccountResponse[] }>(
        "/api/investments/accounts"
      ).then((r) => r.accounts),
    retry: false,
  });
}

export function useCreateInvestmentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; broker?: string; currency: string }) =>
      apiMutate<InvestmentAccountResponse>(
        "/api/investments/accounts",
        "POST",
        data
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["investment-accounts"] }),
  });
}

export function useHoldings(accountId?: string) {
  const sp = new URLSearchParams();
  if (accountId) sp.set("account_id", accountId);

  return useQuery({
    queryKey: ["holdings", accountId],
    queryFn: () =>
      apiFetch<{ holdings: HoldingResponse[] }>(
        `/api/investments/holdings?${sp.toString()}`
      ).then((r) => r.holdings),
    retry: false,
  });
}

export function useTrades(params?: {
  account_id?: string;
  ticker?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.account_id) sp.set("account_id", params.account_id);
  if (params?.ticker) sp.set("ticker", params.ticker);

  return useQuery({
    queryKey: ["trades", params],
    queryFn: () =>
      apiFetch<{ trades: TradeResponse[] }>(
        `/api/investments/trades?${sp.toString()}`
      ).then((r) => r.trades),
    retry: false,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      account_id: string;
      ticker: string;
      side: "buy" | "sell";
      quantity: number;
      price: number;
      trade_date: string;
    }) => apiMutate<{ trade: TradeResponse }>("/api/investments/trades", "POST", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["holdings"] });
    },
  });
}

export function useDividends(accountId?: string) {
  const sp = new URLSearchParams();
  if (accountId) sp.set("account_id", accountId);

  return useQuery({
    queryKey: ["dividends", accountId],
    queryFn: () =>
      apiFetch<{ dividends: DividendResponse[] }>(
        `/api/investments/dividends?${sp.toString()}`
      ).then((r) => r.dividends),
    retry: false,
  });
}

export function useCreateDividend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      account_id: string;
      ticker: string;
      amount: number;
      per_share?: number;
      ex_date?: string;
      pay_date?: string;
    }) =>
      apiMutate<DividendResponse>(
        "/api/investments/dividends",
        "POST",
        data
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dividends"] }),
  });
}
