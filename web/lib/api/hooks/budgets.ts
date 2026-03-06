"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import type { BudgetResponse, BudgetLineResponse } from "../types";

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
