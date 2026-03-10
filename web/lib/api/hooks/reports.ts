"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import { buildSearchParams } from "@/lib/utils";
import type {
  MonthlyTrendPoint,
  CategoryBreakdownItem,
  ReportSummary,
  ReportSpendingFlow,
} from "../types";

export function useMonthlyTrend(params: number | {
  months?: number;
  start_date?: string;
  end_date?: string;
  account_id?: string;
} = {}) {
  const normalizedParams = typeof params === "number" ? { months: params } : params;
  const qs = buildSearchParams(normalizedParams);
  return useQuery({
    queryKey: ["reports", "monthly-trend", normalizedParams],
    queryFn: () =>
      apiFetch<{ data: MonthlyTrendPoint[] }>(
        `/api/reports/monthly-trend?${qs}`
      ).then((r) => r.data),
    retry: false,
  });
}

export function useCategoryBreakdown(params: {
  start_date: string;
  end_date: string;
  kind?: string;
  account_id?: string;
}) {
  const qs = buildSearchParams(params);

  return useQuery({
    queryKey: ["reports", "category-breakdown", params],
    queryFn: () =>
      apiFetch<{ data: CategoryBreakdownItem[]; grand_total: number }>(
        `/api/reports/category-breakdown?${qs}`
      ),
    enabled: !!params.start_date && !!params.end_date,
    retry: false,
  });
}

export function useReportSummary(params: {
  start_date: string;
  end_date: string;
  account_id?: string;
}) {
  const qs = buildSearchParams(params);

  return useQuery({
    queryKey: ["reports", "summary", params],
    queryFn: () => apiFetch<ReportSummary>(`/api/reports/summary?${qs}`),
    enabled: !!params.start_date && !!params.end_date,
    retry: false,
  });
}

export function useReportSpendingFlow(params: {
  start_date: string;
  end_date: string;
  account_id?: string;
}) {
  const qs = buildSearchParams(params);

  return useQuery({
    queryKey: ["reports", "spending-flow", params],
    queryFn: () => apiFetch<ReportSpendingFlow>(`/api/reports/spending-flow?${qs}`),
    enabled: !!params.start_date && !!params.end_date,
    retry: false,
  });
}
