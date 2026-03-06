"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import { buildSearchParams } from "@/lib/utils";
import type {
  InvestmentAccountResponse,
  HoldingResponse,
  TradeResponse,
  DividendResponse,
} from "../types";

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
  const qs = buildSearchParams({ account_id: accountId });

  return useQuery({
    queryKey: ["holdings", accountId],
    queryFn: () =>
      apiFetch<{ holdings: HoldingResponse[] }>(
        `/api/investments/holdings?${qs}`
      ).then((r) => r.holdings),
    retry: false,
  });
}

export function useTrades(params?: {
  account_id?: string;
  ticker?: string;
}) {
  const qs = buildSearchParams(params ?? {});

  return useQuery({
    queryKey: ["trades", params],
    queryFn: () =>
      apiFetch<{ trades: TradeResponse[] }>(
        `/api/investments/trades?${qs}`
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
  const qs = buildSearchParams({ account_id: accountId });

  return useQuery({
    queryKey: ["dividends", accountId],
    queryFn: () =>
      apiFetch<{ dividends: DividendResponse[] }>(
        `/api/investments/dividends?${qs}`
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
