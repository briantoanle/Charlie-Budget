"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMonthlyTrend } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function MonthlyTrendChart() {
  const { data, isLoading } = useMonthlyTrend(6);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg skeleton-shimmer" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Not enough data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: new Date(d.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
    Income: d.income,
    Spending: Math.abs(d.spending),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Monthly Trend
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b9a6b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b9a6b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e07a5f" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#e07a5f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1d26",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number | undefined) => [
              `$${(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: "11px", color: "#6b7280" }}
          />
          <Area
            type="monotone"
            dataKey="Income"
            stroke="#8b9a6b"
            strokeWidth={2}
            fill="url(#incomeGrad)"
          />
          <Area
            type="monotone"
            dataKey="Spending"
            stroke="#e07a5f"
            strokeWidth={2}
            fill="url(#spendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
