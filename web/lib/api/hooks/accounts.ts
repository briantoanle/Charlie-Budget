"use client";

import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import type { AccountResponse } from "../types";

const ACCOUNTS_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      apiFetch<{ accounts: AccountResponse[] }>("/api/accounts").then(
        (r) => r.accounts
      ),
    ...ACCOUNTS_QUERY_OPTIONS,
  });
}

export function useSuspenseAccounts() {
  return useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      apiFetch<{ accounts: AccountResponse[] }>("/api/accounts").then(
        (r) => r.accounts
      ),
    ...ACCOUNTS_QUERY_OPTIONS,
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
