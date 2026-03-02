"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useHoldings } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioBreakdown() {
  const { data: holdings, isLoading } = useHoldings();

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl skeleton-shimmer" />;

  const data = holdings ?? [];
  if (data.length === 0) return null;

  // Group by ticker for simple breakdown
  const chartData = data.map(h => ({
    name: h.ticker,
    value: h.market_value
  })).sort((a, b) => b.value - a.value);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--positive))",
    "hsl(var(--accent))",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px"
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
