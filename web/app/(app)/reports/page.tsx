"use client";

import type { ComponentType, ReactNode } from "react";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  Filter,
  Flame,
  Landmark,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useAccounts,
  useCategoryBreakdown,
  useMonthlyTrend,
  useReportSpendingFlow,
  useReportSummary,
  useTransactions,
} from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker, type DateRangeValue } from "@/components/ui/date-range-picker";
import { TransactionTable } from "@/components/transactions/transaction-table";
import {
  FadeIn,
  PageTransition,
  StaggerItem,
  StaggerList,
} from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";

type CategoryKind = "expense" | "income";

type TrendChartPoint = {
  monthKey: string;
  label: string;
  income: number;
  spending: number;
  net: number;
  savingsRate: number;
};

type BreakdownChartPoint = {
  categoryId: string;
  category: string;
  fullLabel: string;
  total: number;
  share: number;
  previousTotal: number;
  delta: number;
};

const CATEGORY_COLORS = [
  "hsl(215 100% 50%)",
  "hsl(142 71% 45%)",
  "hsl(18 74% 61%)",
  "hsl(38 92% 50%)",
  "hsl(198 45% 51%)",
  "hsl(280 67% 55%)",
  "hsl(338 72% 59%)",
  "hsl(168 55% 42%)",
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => getPresetRange("6m"));
  const [accountId, setAccountId] = useState("all");
  const [focusKind, setFocusKind] = useState<CategoryKind>("expense");
  const [compareMode, setCompareMode] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const accountParam = accountId === "all" ? undefined : accountId;
  const summaryParams = useMemo(
    () => ({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      account_id: accountParam,
    }),
    [accountParam, dateRange.endDate, dateRange.startDate]
  );
  const comparisonRange = useMemo(() => getComparisonRange(dateRange), [dateRange]);
  const drilldownRange = useMemo(
    () => (selectedMonth ? clampMonthToRange(selectedMonth, dateRange) : dateRange),
    [dateRange, selectedMonth]
  );

  const { data: accounts } = useAccounts();
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useReportSummary(summaryParams);
  const { data: trend, isLoading: loadingTrend, error: trendError } = useMonthlyTrend(summaryParams);
  const { data: currentBreakdown, isLoading: loadingBreakdown, error: breakdownError } =
    useCategoryBreakdown({
      ...summaryParams,
      kind: focusKind,
    });
  const { data: previousBreakdown } = useCategoryBreakdown({
    start_date: comparisonRange.startDate,
    end_date: comparisonRange.endDate,
    account_id: accountParam,
    kind: focusKind,
  });
  const { data: spendingFlow, isLoading: loadingFlow } = useReportSpendingFlow(summaryParams);
  const transactionsQuery = useTransactions({
    per_page: 50,
    account_id: accountParam,
    category_id: selectedCategoryId === "all" ? undefined : selectedCategoryId,
    start_date: drilldownRange.startDate,
    end_date: drilldownRange.endDate,
    search: deferredSearch,
    kind: focusKind,
  });

  const transactionRows = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [transactionsQuery.data]
  );
  const transactionTotal = transactionsQuery.data?.pages[0]?.pagination.total ?? 0;

  const trendData = useMemo<TrendChartPoint[]>(
    () =>
      (trend ?? []).map((point) => ({
        monthKey: point.month,
        label: formatMonth(point.month),
        income: point.income,
        spending: point.spending,
        net: point.net,
        savingsRate: point.income > 0 ? (point.net / point.income) * 100 : 0,
      })),
    [trend]
  );

  const breakdownData = useMemo<BreakdownChartPoint[]>(() => {
    const previousMap = new Map(
      (previousBreakdown?.data ?? []).map((item) => [
        item.category_id ?? "uncategorized",
        item.total,
      ])
    );

    return (currentBreakdown?.data ?? []).slice(0, 7).map((item) => {
      const categoryId = item.category_id ?? "uncategorized";
      const previousTotal = previousMap.get(categoryId) ?? 0;
      return {
        categoryId,
        category: truncateLabel(item.category_name, 14),
        fullLabel: item.category_name,
        total: item.total,
        share: item.percentage,
        previousTotal,
        delta: item.total - previousTotal,
      };
    });
  }, [currentBreakdown?.data, previousBreakdown?.data]);

  const kpiCards = useMemo(() => {
    const savingsTrend = trendData.map((point) => point.savingsRate);
    return [
      {
        key: "income",
        label: "Income",
        value: summary?.income ?? 0,
        delta: summary?.comparison.income,
        tone: "positive" as const,
        icon: CircleDollarSign,
        sparkline: trendData.map((point) => point.income),
        suffix: "",
      },
      {
        key: "spending",
        label: "Spending",
        value: summary?.spending ?? 0,
        delta: summary?.comparison.spending,
        tone: "negative" as const,
        icon: Wallet,
        sparkline: trendData.map((point) => point.spending),
        suffix: "",
      },
      {
        key: "net",
        label: "Net Cashflow",
        value: summary?.net ?? 0,
        delta: summary?.comparison.net,
        tone: (summary?.net ?? 0) >= 0 ? ("positive" as const) : ("negative" as const),
        icon: Landmark,
        sparkline: trendData.map((point) => point.net),
        suffix: "",
      },
      {
        key: "savings-rate",
        label: "Savings Rate",
        value: summary?.savings_rate ?? 0,
        delta: summary?.comparison.savings_rate,
        tone: (summary?.savings_rate ?? 0) >= 0 ? ("positive" as const) : ("negative" as const),
        icon: Sparkles,
        sparkline: savingsTrend,
        suffix: "%",
      },
      {
        key: "burn",
        label: "Avg Monthly Burn",
        value: summary?.average_monthly_spend ?? 0,
        delta: summary?.comparison.average_monthly_spend,
        tone: "negative" as const,
        icon: Flame,
        sparkline: trendData.map((point) => point.spending),
        suffix: "",
      },
      {
        key: "top-category",
        label: "Top Category",
        value: summary?.top_category?.total ?? 0,
        delta: undefined,
        tone: "neutral" as const,
        icon: Filter,
        sparkline: breakdownData.map((point) => point.total),
        suffix: "",
        secondary: summary?.top_category
          ? `${summary.top_category.category_name} • ${summary.top_category.percentage.toFixed(1)}%`
          : "No dominant category yet",
      },
    ];
  }, [breakdownData, summary, trendData]);

  const apiNotReady = summaryError || trendError || breakdownError;

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <FadeIn>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
              <p className="text-sm text-muted-foreground">
                Health check first, then trends, composition, and transaction-level drill-down.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {selectedMonth && <Badge variant="outline">Drilled into {formatMonth(selectedMonth)}</Badge>}
              {selectedCategoryName && <Badge variant="outline">{selectedCategoryName}</Badge>}
            </div>
          </div>
        </FadeIn>

        <FiltersCard
          dateRange={dateRange}
          onDateRangeChange={(nextRange) => {
            setDateRange(nextRange);
            setSelectedMonth(null);
          }}
          accountId={accountId}
          onAccountChange={setAccountId}
          accounts={accounts ?? []}
          focusKind={focusKind}
          onFocusKindChange={(value) => {
            setFocusKind(value);
            setSelectedCategoryId("all");
            setSelectedCategoryName(null);
          }}
          compareMode={compareMode}
          onCompareModeChange={() => setCompareMode((current) => !current)}
          onResetDrilldown={() => {
            setSelectedMonth(null);
            setSelectedCategoryId("all");
            setSelectedCategoryName(null);
            setSearch("");
          }}
        />

        {apiNotReady && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Reports need transaction data before this view can render. Connect an account or add
              transactions, then reload the page.
            </CardContent>
          </Card>
        )}

        <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loadingSummary
            ? Array.from({ length: 6 }).map((_, index) => (
                <StaggerItem key={index}>
                  <Skeleton className="h-40 rounded-2xl skeleton-shimmer" />
                </StaggerItem>
              ))
            : kpiCards.map((card, index) => (
                <StaggerItem key={card.key}>
                  <MetricCard
                    label={card.label}
                    value={card.value}
                    delta={card.delta}
                    tone={card.tone}
                    icon={card.icon}
                    data={card.sparkline}
                    compareMode={compareMode}
                    secondary={card.secondary}
                    suffix={card.suffix}
                    color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                </StaggerItem>
              ))}
        </StaggerList>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <TrendCard
            data={trendData}
            loading={loadingTrend}
            selectedMonth={selectedMonth}
            onMonthSelect={(monthKey) => setSelectedMonth((current) => (current === monthKey ? null : monthKey))}
          />
          <DonutCard
            data={breakdownData}
            loading={loadingBreakdown}
            focusKind={focusKind}
            selectedCategoryId={selectedCategoryId}
            compareMode={compareMode}
            onCategorySelect={(categoryId, categoryName) => {
              setSelectedCategoryId((current) => (current === categoryId ? "all" : categoryId));
              setSelectedCategoryName((current) => (current === categoryName ? null : categoryName));
            }}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <CategoryBreakdownCard
            data={breakdownData}
            loading={loadingBreakdown}
            focusKind={focusKind}
            compareMode={compareMode}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(categoryId, categoryName) => {
              setSelectedCategoryId((current) => (current === categoryId ? "all" : categoryId));
              setSelectedCategoryName((current) => (current === categoryName ? null : categoryName));
            }}
          />
          <SpendingFlowCard data={spendingFlow} loading={loadingFlow} />
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Transaction Drill-down</CardTitle>
                <CardDescription>
                  Investigate the selected slice with date, category, and merchant filters.
                </CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search merchant or note"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{focusKind === "expense" ? "Expense flow" : "Income flow"}</Badge>
              <Badge variant="outline">
                Range: {formatDateLabel(drilldownRange.startDate)} to {formatDateLabel(drilldownRange.endDate)}
              </Badge>
              {selectedCategoryName && <Badge variant="outline">Category: {selectedCategoryName}</Badge>}
              {transactionTotal > transactionRows.length && (
                <Badge variant="outline">Showing latest {transactionRows.length} of {transactionTotal}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactionsQuery.isLoading ? (
              <Skeleton className="h-72 rounded-2xl skeleton-shimmer" />
            ) : (
              <TransactionTable transactions={transactionRows} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

function FiltersCard(props: {
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  accountId: string;
  onAccountChange: (value: string) => void;
  accounts: Array<{ id: string; name: string }>;
  focusKind: CategoryKind;
  onFocusKindChange: (value: CategoryKind) => void;
  compareMode: boolean;
  onCompareModeChange: () => void;
  onResetDrilldown: () => void;
}) {
  const calendarPresets = useMemo(
    () => [
      { label: "Last 3 Months", getRange: () => getPresetRange("3m") },
      { label: "Last 6 Months", getRange: () => getPresetRange("6m") },
      { label: "Year to Date", getRange: () => getPresetRange("ytd") },
      { label: "This Month", getRange: () => getPresetRange("month") },
    ],
    []
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid items-start gap-4 py-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <CalendarRange className="size-3.5" />
              <span>Reporting Window</span>
            </div>
            <DateRangePicker
              value={props.dateRange}
              onChange={props.onDateRangeChange}
              presets={calendarPresets}
              className="min-w-0 max-w-2xl"
            />
            <div className="flex flex-wrap gap-2">
              {REPORTING_WINDOW_PRESETS.map((preset) => {
                const active = isSameRangeValue(props.dateRange, getPresetRange(preset.key));
                return (
                  <Button
                    key={preset.key}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => props.onDateRangeChange(getPresetRange(preset.key))}
                    className="rounded-full px-4"
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FilterField label="Compare">
            <Button
              variant={props.compareMode ? "default" : "outline"}
              className="w-full justify-center"
              onClick={props.onCompareModeChange}
            >
              {props.compareMode ? "Previous period on" : "Previous period off"}
            </Button>
          </FilterField>
          <FilterField label="Account">
            <Select value={props.accountId} onValueChange={props.onAccountChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {props.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Focus">
            <Select value={props.focusKind} onValueChange={(value) => props.onFocusKindChange(value as CategoryKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Drill-down
                </p>
                <p className="text-sm text-muted-foreground">
                  Reset month and category selections.
                </p>
              </div>
              <Button variant="outline" onClick={props.onResetDrilldown} className="w-full sm:w-auto">
                Reset drill-down
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterField(props: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{props.label}</p>
      {props.children}
    </div>
  );
}

function MetricCard(props: {
  label: string;
  value: number;
  delta?: { value: number; percentage: number | null };
  tone: "positive" | "negative" | "neutral";
  icon: ComponentType<{ className?: string }>;
  data: number[];
  compareMode: boolean;
  secondary?: string;
  suffix?: string;
  color: string;
}) {
  const Icon = props.icon;
  const isPercentage = props.suffix === "%";
  const positiveTone = props.tone === "positive";

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex h-full flex-col justify-between gap-5 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{props.label}</p>
            <div className="space-y-2">
              <p className="text-3xl font-semibold tracking-tight">
                {isPercentage ? `${props.value.toFixed(1)}%` : formatCurrency(props.value)}
              </p>
              {props.secondary && <p className="text-sm text-muted-foreground">{props.secondary}</p>}
            </div>
          </div>
          <div
            className="flex size-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${props.color}1A`, color: props.color }}
          >
            <Icon className="size-5" />
          </div>
        </div>

        <div className="space-y-3">
          {props.compareMode && props.delta && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
                  positiveTone
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {(props.delta.value >= 0 && positiveTone) || (props.delta.value < 0 && !positiveTone) ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {formatDelta(props.delta, isPercentage)}
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          )}

          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={props.data.map((value, index) => ({ index, value }))}
                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`spark-${props.label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={props.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={props.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={false}
                  formatter={(value: number | string | undefined) => [
                    isPercentage
                      ? `${Number(value ?? 0).toFixed(1)}%`
                      : formatCurrency(Number(value ?? 0)),
                    props.label,
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={props.color}
                  fill={`url(#spark-${props.label})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard(props: {
  data: TrendChartPoint[];
  loading: boolean;
  selectedMonth: string | null;
  onMonthSelect: (monthKey: string) => void;
}) {
  const handleBarClick = (payload: unknown) => {
    const monthKey = (payload as { payload?: TrendChartPoint })?.payload?.monthKey;
    if (monthKey) {
      props.onMonthSelect(monthKey);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cashflow</CardTitle>
        <CardDescription>
          Income and spending bars with net cashflow trend. Click a month to drill into transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <Skeleton className="h-[360px] rounded-2xl skeleton-shimmer" />
        ) : props.data.length > 0 ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={props.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="hsl(var(--success))"
                  radius={[10, 10, 4, 4]}
                  onClick={handleBarClick}
                />
                <Bar
                  dataKey="spending"
                  name="Spending"
                  fill="hsl(var(--destructive))"
                  radius={[10, 10, 4, 4]}
                  onClick={handleBarClick}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.monthKey === props.selectedMonth ? 6 : 4}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  )}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No transaction trend data in this range." />
        )}
      </CardContent>
    </Card>
  );
}

function DonutCard(props: {
  data: BreakdownChartPoint[];
  loading: boolean;
  focusKind: CategoryKind;
  selectedCategoryId: string;
  compareMode: boolean;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.focusKind === "expense" ? "Spend Share" : "Income Share"}</CardTitle>
        <CardDescription>
          Composition view for the current period. Click a slice or legend row to drill down.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.loading ? (
          <Skeleton className="h-[360px] rounded-2xl skeleton-shimmer" />
        ) : props.data.length > 0 ? (
          <>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={props.data}
                    dataKey="total"
                    nameKey="fullLabel"
                    innerRadius={72}
                    outerRadius={106}
                    paddingAngle={3}
                    onClick={(payload: BreakdownChartPoint) =>
                      props.onCategorySelect(payload.categoryId, payload.fullLabel)
                    }
                  >
                    {props.data.map((entry, index) => (
                      <Cell
                        key={entry.categoryId}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        stroke={
                          props.selectedCategoryId === entry.categoryId
                            ? "hsl(var(--foreground))"
                            : "transparent"
                        }
                        strokeWidth={props.selectedCategoryId === entry.categoryId ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | string | undefined, _name, item) => [
                      formatCurrency(Number(value ?? 0)),
                      `${item?.payload?.fullLabel ?? "Category"} · ${item?.payload?.share?.toFixed(1) ?? "0.0"}%`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {props.data.map((item, index) => (
                <button
                  key={item.categoryId}
                  type="button"
                  onClick={() => props.onCategorySelect(item.categoryId, item.fullLabel)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors",
                    props.selectedCategoryId === item.categoryId
                      ? "border-foreground/20 bg-foreground/[0.03]"
                      : "border-transparent hover:border-border"
                  )}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.fullLabel}</p>
                    <p className="text-xs text-muted-foreground">{item.share.toFixed(1)}% of total</p>
                  </div>
                  {props.compareMode && (
                    <span className={cn("text-xs font-medium", item.delta > 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")}>
                      {item.delta > 0 ? "+" : ""}
                      {formatCompactCurrency(item.delta)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState message={`No ${props.focusKind} categories in this range.`} />
        )}
      </CardContent>
    </Card>
  );
}

function CategoryBreakdownCard(props: {
  data: BreakdownChartPoint[];
  loading: boolean;
  focusKind: CategoryKind;
  compareMode: boolean;
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}) {
  const handleBarClick = (payload: unknown) => {
    const item = (payload as { payload?: BreakdownChartPoint })?.payload;
    if (item) {
      props.onCategorySelect(item.categoryId, item.fullLabel);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Ranked bars make the biggest categories and period-over-period changes obvious.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {props.loading ? (
          <Skeleton className="h-[360px] rounded-2xl skeleton-shimmer" />
        ) : props.data.length > 0 ? (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={props.data} layout="vertical" margin={{ top: 0, right: 12, left: 12, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) => formatCompactCurrency(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                  />
                  {props.compareMode && (
                    <Bar dataKey="previousTotal" name="Previous period" fill="hsl(var(--muted-foreground) / 0.25)" radius={[0, 10, 10, 0]} />
                  )}
                  <Bar
                    dataKey="total"
                    name={props.focusKind === "expense" ? "Current spend" : "Current income"}
                    fill="hsl(var(--primary))"
                    radius={[0, 10, 10, 0]}
                    onClick={handleBarClick}
                  >
                    {props.data.map((entry, index) => (
                      <Cell
                        key={entry.categoryId}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        opacity={props.selectedCategoryId === "all" || props.selectedCategoryId === entry.categoryId ? 1 : 0.45}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {props.data.map((item) => (
                <button
                  key={item.categoryId}
                  type="button"
                  onClick={() => props.onCategorySelect(item.categoryId, item.fullLabel)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                    props.selectedCategoryId === item.categoryId
                      ? "border-foreground/20 bg-foreground/[0.03]"
                      : "border-transparent hover:border-border"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.fullLabel}</p>
                    <p className="text-xs text-muted-foreground">{item.share.toFixed(1)}% of total</p>
                  </div>
                  {props.compareMode && (
                    <span className={cn("text-xs font-medium", item.delta > 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")}>
                      {item.delta > 0 ? "+" : ""}
                      {formatCompactCurrency(item.delta)}
                    </span>
                  )}
                  <span className="font-mono text-sm font-semibold font-tabular">{formatCurrency(item.total)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState message={`No ${props.focusKind} categories in this range.`} />
        )}
      </CardContent>
    </Card>
  );
}

function SpendingFlowCard(props: {
  data?: { nodes: Array<{ name: string }>; links: Array<{ source: number; target: number; value: number }> };
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Money Flow</CardTitle>
        <CardDescription>
          Sankey view of how total spend fans out into categories and top merchants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <Skeleton className="h-[360px] rounded-2xl skeleton-shimmer" />
        ) : props.data && props.data.links.length > 0 ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={props.data}
                nodePadding={28}
                nodeWidth={14}
                margin={{ top: 16, right: 24, left: 24, bottom: 16 }}
                link={{ stroke: "hsl(var(--primary) / 0.18)" }}
              >
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="Not enough spending diversity in this range to draw a flow view." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState(props: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
      {props.message}
    </div>
  );
}

function getPresetRange(preset: "3m" | "6m" | "ytd" | "month"): DateRangeValue {
  const today = noon(new Date());
  if (preset === "ytd") {
    return { startDate: formatDateValue(new Date(today.getFullYear(), 0, 1)), endDate: formatDateValue(today) };
  }
  if (preset === "month") {
    return { startDate: formatDateValue(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: formatDateValue(today) };
  }

  const months = preset === "3m" ? 2 : 5;
  return {
    startDate: formatDateValue(new Date(today.getFullYear(), today.getMonth() - months, 1)),
    endDate: formatDateValue(today),
  };
}

function isSameRangeValue(left: DateRangeValue, right: DateRangeValue) {
  return left.startDate === right.startDate && left.endDate === right.endDate;
}

function getComparisonRange(range: DateRangeValue): DateRangeValue {
  const start = parseDateValue(range.startDate);
  const end = parseDateValue(range.endDate);
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
  const comparisonEnd = noon(new Date(start));
  comparisonEnd.setDate(comparisonEnd.getDate() - 1);
  const comparisonStart = noon(new Date(comparisonEnd));
  comparisonStart.setDate(comparisonStart.getDate() - (days - 1));

  return {
    startDate: formatDateValue(comparisonStart),
    endDate: formatDateValue(comparisonEnd),
  };
}

function clampMonthToRange(monthKey: string, range: DateRangeValue): DateRangeValue {
  const monthStart = parseDateValue(`${monthKey}-01`);
  const monthEnd = noon(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0));
  const rangeStart = parseDateValue(range.startDate);
  const rangeEnd = parseDateValue(range.endDate);

  return {
    startDate: formatDateValue(monthStart.getTime() < rangeStart.getTime() ? rangeStart : monthStart),
    endDate: formatDateValue(monthEnd.getTime() > rangeEnd.getTime() ? rangeEnd : monthEnd),
  };
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return noon(new Date(year, month - 1, day));
}

function noon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function formatDateLabel(value: string) {
  return parseDateValue(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}k`;
  return `${value < 0 ? "-" : ""}$${abs.toFixed(0)}`;
}

function formatDelta(
  delta: { value: number; percentage: number | null },
  isPercentage: boolean
) {
  if (delta.percentage == null) {
    return isPercentage ? `${delta.value.toFixed(1)} pts` : formatCompactCurrency(delta.value);
  }

  return `${delta.percentage >= 0 ? "+" : ""}${delta.percentage.toFixed(1)}%`;
}

function truncateLabel(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card) / 0.96)",
  boxShadow: "0 16px 32px -20px rgba(15, 23, 42, 0.35)",
};

const REPORTING_WINDOW_PRESETS: Array<{ key: "month" | "3m" | "6m" | "ytd"; label: string }> = [
  { key: "month", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "ytd", label: "YTD" },
];
