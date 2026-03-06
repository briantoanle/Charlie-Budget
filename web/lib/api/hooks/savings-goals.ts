"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import type { SavingsGoalResponse } from "../types";

export function useSavingsGoals(includeArchived = false) {
  return useQuery({
    queryKey: ["savings-goals", { includeArchived }],
    queryFn: () =>
      apiFetch<{ goals: SavingsGoalResponse[] }>(
        `/api/savings-goals${includeArchived ? "?include_archived=true" : ""}`
      ).then((r) => r.goals),
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      target_amount: number;
      current_amount?: number;
      target_date?: string;
      color?: string;
      emoji?: string;
    }) => apiMutate<{ goal: SavingsGoalResponse }>("/api/savings-goals", "POST", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      target_amount?: number;
      current_amount?: number;
      target_date?: string;
      color?: string;
      emoji?: string;
      archived?: boolean;
    }) => apiMutate<{ goal: SavingsGoalResponse }>(`/api/savings-goals/${id}`, "PATCH", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiMutate<void>(`/api/savings-goals/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}
