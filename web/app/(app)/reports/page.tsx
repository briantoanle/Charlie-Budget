"use client";

import { useState, useMemo } from "react";
import { useMonthlyTrend, useCategoryBreakdown } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion-primitives";

export default function ReportsPage() {
  const [months, setMonths] = useState(12);
  const { data: trend, isLoading: loadingTrend, error: trendError } = useMonthlyTrend(months);

  // Category breakdown date range = current month
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = now.toISOString().slice(0, 10);

  const [kind, setKind] = useState("expense");
  const { data: breakdown, isLoading: loadingBreakdown, error: breakdownError } =
    useCategoryBreakdown({
      start_date: startDate,
      end_date: endDate,
      kind,
    });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  // Find max value for scaling the bars
  const maxTrendValue = useMemo(() => {
    if (!trend) return 0;
    return Math.max(...trend.flatMap((t) => [t.income, t.spending]), 1);
  }, [trend]);

  const apiNotReady = trendError || breakdownError;

  return (
    <PageTransition>
    <div className="mx-auto max-w-6xl space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Visualize your financial trends
        </p>
      </FadeIn>

      {apiNotReady && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Reports API is not available yet. Connect your bank and add
            transactions to see data here.
          </p>
        </div>
      )}

      {/* ── Monthly Trend ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Monthly Cashflow
          </h2>
          <Select
            value={String(months)}
            onValueChange={(v) => setMonths(Number(v))}
          >
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
              <SelectItem value="24">24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingTrend ? (
          <Skeleton className="h-48 rounded-lg skeleton-shimmer" />
        ) : trend && trend.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-4">
            {/* Bar chart legend */}
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-positive" />
                Income
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-destructive" />
                Spending
              </span>
            </div>

            {/* Simple horizontal bar chart */}
            <StaggerList className="space-y-2">
              {trend.map((point) => {
                const incPct = (point.income / maxTrendValue) * 100;
                const spPct = (point.spending / maxTrendValue) * 100;
                const incWidth = point.income > 0 ? Math.max(incPct, 1) : 0;
                const spWidth = point.spending > 0 ? Math.max(spPct, 1) : 0;
                const [y, m] = point.month.split("-");
                const label = new Date(
                  parseInt(y),
                  parseInt(m) - 1
                ).toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });

                return (
                  <StaggerItem key={point.month}>
                  <div className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 rounded-sm transition-all"
                          style={{
                            width: `${incWidth}%`,
                            backgroundColor: "hsl(var(--success, 142 71% 45%))",
                          }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground font-tabular">
                          {fmt(point.income)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 rounded-sm transition-all"
                          style={{
                            width: `${spWidth}%`,
                            backgroundColor: "hsl(var(--destructive, 0 72% 51%))",
                          }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground font-tabular">
                          {fmt(point.spending)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="w-16 text-right font-mono text-xs font-medium font-tabular"
                      style={{
                        color:
                          point.net >= 0
                            ? "hsl(var(--success, 142 71% 45%))"
                            : "hsl(var(--destructive, 0 72% 51%))",
                      }}
                    >
                      {point.net >= 0 ? "+" : ""}
                      {fmt(point.net)}
                    </span>
                  </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </div>
        ) : !trendError ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No data yet. Add transactions to see your cashflow trend.
          </div>
        ) : null}
      </div>

      {/* ── Category Breakdown ────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Category Breakdown — This Month
          </h2>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingBreakdown ? (
          <Skeleton className="h-48 rounded-lg skeleton-shimmer" />
        ) : breakdown && breakdown.data.length > 0 ? (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {breakdown.data.map((item, idx) => (
              <div key={item.category_id ?? "null"} className="flex items-center gap-4 px-4 py-3">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: getCategoryColor(idx),
                  }}
                />
                <span className="flex-1 text-sm font-medium">
                  {item.category_name}
                </span>
                <span className="font-mono text-sm font-tabular text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="w-24 text-right font-mono text-sm font-semibold font-tabular">
                  {fmt(item.total)}
                </span>
              </div>
            ))}
            {/* Grand total */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-sm font-semibold font-tabular">
                {fmt(breakdown.grand_total)}
              </span>
            </div>
          </div>
        ) : !breakdownError ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No {kind} data this month.
          </div>
        ) : null}
      </div>
    </div>
    </PageTransition>
  );
}

// Muted palette for category breakdown dots
const CATEGORY_COLORS = [
  "#8B9A6B", "#E07A5F", "#6B8E9A", "#9A8B6B", "#7B6B9A",
  "#6B9A8B", "#9A6B7B", "#6B7B9A", "#A0896B", "#6B9A6B",
];

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
