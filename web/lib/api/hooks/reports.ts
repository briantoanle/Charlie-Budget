"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import { buildSearchParams } from "@/lib/utils";
import type { MonthlyTrendPoint, CategoryBreakdownItem } from "../types";

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
