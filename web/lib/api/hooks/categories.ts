"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import type { CategoryResponse } from "../types";

export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: ["categories", { includeArchived }],
    queryFn: () =>
      apiFetch<{ categories: CategoryResponse[] }>(
        `/api/categories${includeArchived ? "?include_archived=true" : ""}`
      ).then((r) => r.categories),
  });
}

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
