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
