"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import { buildSearchParams } from "@/lib/utils";
import type { TransactionResponse, TransactionPagination } from "../types";
import type { SpendMapResponse } from "../types";

type TransactionPage = {
  data: TransactionResponse[];
  pagination: TransactionPagination;
};

export function useTransactions(params: {
  per_page?: number;
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) {
  return useInfiniteQuery<TransactionPage>({
    queryKey: ["transactions", params],
    queryFn: ({ pageParam }) => {
      const qs = buildSearchParams({ ...params, page: pageParam });
      return apiFetch<TransactionPage>(`/api/transactions?${qs}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, per_page, total } = lastPage.pagination;
      return page * per_page < total ? page + 1 : undefined;
    },
  });
}

export function useSuspenseTransactions(params: {
  per_page?: number;
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) {
  const qs = buildSearchParams(params);
  return useSuspenseQuery({
    queryKey: ["transactions", params],
    queryFn: () => apiFetch<TransactionPage>(`/api/transactions?${qs}`),
  });
}

export function useSpendingMap(params: {
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) {
  const qs = buildSearchParams(params);

  return useQuery({
    queryKey: ["spending-map", params],
    queryFn: () =>
      apiFetch<SpendMapResponse>(`/api/transactions/map?${qs}`),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      account_id: string;
      txn_date: string;
      amount: number;
      merchant?: string;
      note?: string;
      category_id?: string;
      currency?: string;
    }) => apiMutate<TransactionResponse>("/api/transactions", "POST", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      category_id?: string;
      merchant?: string;
      note?: string;
    }) => apiMutate<TransactionResponse>(`/api/transactions/${id}`, "PATCH", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
