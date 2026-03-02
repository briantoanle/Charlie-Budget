"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useCategoryBreakdown } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

function getMonthRange(offset: number) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return { start_date: start, end_date: endStr };
}

export function CategoryComparisonChart() {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(-1);

  const { data: current, isLoading: loadingCurrent } = useCategoryBreakdown({
    ...thisMonth,
    kind: "expense",
  });
  const { data: previous, isLoading: loadingPrevious } = useCategoryBreakdown({
    ...lastMonth,
    kind: "expense",
  });

  if (loadingCurrent || loadingPrevious) {
    return <Skeleton className="h-64 w-full rounded-lg skeleton-shimmer" />;
  }

  if (!current?.data || current.data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Not enough data yet
      </div>
    );
  }

  // Build comparison data — top 5 categories from this month
  const prevMap = new Map(
    (previous?.data ?? []).map((p: { category_name: string; total: number }) => [p.category_name, Math.abs(p.total)])
  );

  const chartData = current.data
    .slice(0, 5)
    .map((c: { category_name: string; total: number }) => ({
      category: c.category_name.length > 12
        ? c.category_name.slice(0, 12) + "…"
        : c.category_name,
      "This Month": Math.abs(c.total),
      "Last Month": prevMap.get(c.category_name) ?? 0,
    }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Top Categories
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
            }
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={80}
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
          <Bar dataKey="This Month" fill="#8b9a6b" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="Last Month" fill="#6b7280" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
