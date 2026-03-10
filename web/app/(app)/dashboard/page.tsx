"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BanknoteArrowDown,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ScissorsLineDashed,
  TrendingUp,
} from "lucide-react";
import { useSuspenseAccounts, useSuspenseTransactions } from "@/lib/api/hooks";
import { CashflowCard } from "@/components/dashboard/cashflow-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { formatMoney } from "@/lib/utils";
import { annotateExcludedSpendingTransactions, calculateTotalSpending } from "@/lib/spending";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { CategoryComparisonChart } from "@/components/dashboard/category-comparison-chart";
import { RecurringBillsWidget } from "@/components/dashboard/recurring-bills-widget";
import { UncategorizedTransactions } from "@/components/dashboard/uncategorized-transactions";

const discretionaryCategories = new Set([
  "Dining Out",
  "Dining",
  "Restaurants",
  "Shopping",
  "Entertainment",
  "Services",
  "Travel",
]);

export default function DashboardPage() {
  const { data: accounts } = useSuspenseAccounts();
  const { data: recent } = useSuspenseTransactions({ per_page: 7 });

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0),
    [accounts]
  );

  const monthWindow = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const today = now.toISOString().slice(0, 10);
    return { monthStart, today };
  }, []);

  const { data: monthTransactions } = useSuspenseTransactions({
    start_date: monthWindow.monthStart,
    end_date: monthWindow.today,
    per_page: 300,
  });

  const normalizedMonthTransactions = useMemo(
    () => annotateExcludedSpendingTransactions(monthTransactions.data),
    [monthTransactions.data]
  );

  const income = useMemo(
    () =>
      normalizedMonthTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [normalizedMonthTransactions]
  );

  const expenses = useMemo(
    () => calculateTotalSpending(normalizedMonthTransactions),
    [normalizedMonthTransactions]
  );

  const savings = income - expenses;
  const burnMultiple = income > 0 ? expenses / income : null;
  const expenseTransactions = useMemo(
    () => normalizedMonthTransactions.filter((t) => t.amount < 0 && !t.excludeFromSpending),
    [normalizedMonthTransactions]
  );
  const discretionarySpend = useMemo(
    () =>
      expenseTransactions
        .filter((t) => discretionaryCategories.has(t.category_name ?? ""))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [expenseTransactions]
  );
  const largestExpense = useMemo(
    () =>
      expenseTransactions.reduce((largest, current) => {
        if (!largest) return current;
        return Math.abs(current.amount) > Math.abs(largest.amount) ? current : largest;
      }, null as (typeof expenseTransactions)[number] | null),
    [expenseTransactions]
  );
  const avgDailySpend = useMemo(() => {
    const today = new Date().getDate();
    return today > 0 ? expenses / today : expenses;
  }, [expenses]);
  const projectedExpenses = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return avgDailySpend * daysInMonth;
  }, [avgDailySpend]);
  const projectedNet = income - projectedExpenses;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const healthTone =
    savings >= 0
      ? "border-emerald-200 bg-emerald-50/80"
      : "border-rose-200 bg-rose-50/85";
  const healthIconTone =
    savings >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  const statusLabel = savings >= 0 ? "Positive cash flow" : "Negative cash flow";
  const topSummary = savings >= 0
    ? `You saved ${formatMoney(savings)} in ${monthLabel}.`
    : `You are short ${formatMoney(Math.abs(savings))} this month.`;
  const recoveryItems = [
    {
      title: "Projected month-end",
      value: formatMoney(projectedNet),
      hint: projectedNet >= 0 ? "On track to finish positive" : "At the current pace",
      icon: TrendingUp,
      tone: projectedNet >= 0 ? "text-success" : "text-destructive",
    },
    {
      title: "Largest expense",
      value: largestExpense ? formatMoney(Math.abs(largestExpense.amount)) : "$0",
      hint: largestExpense?.merchant || "No expenses yet",
      icon: CircleDollarSign,
      tone: "text-foreground",
    },
    {
      title: "Discretionary spend",
      value: formatMoney(discretionarySpend),
      hint: "Dining, shopping, services, travel",
      icon: ScissorsLineDashed,
      tone: discretionarySpend > Math.abs(savings) ? "text-destructive" : "text-foreground",
    },
  ];
  const metricCards = [
    {
      title: "Available Balance",
      value: formatMoney(totalBalance),
      change: `${accounts.length} account${accounts.length === 1 ? "" : "s"} connected`,
      icon: Landmark,
      tone: "text-foreground",
    },
    {
      title: "Income",
      value: formatMoney(income),
      change: "Posted this month",
      icon: ArrowDownLeft,
      tone: "text-success",
    },
    {
      title: "Spending",
      value: formatMoney(expenses),
      change: burnMultiple ? `${burnMultiple.toFixed(1)}x income` : "No income posted",
      icon: BanknoteArrowDown,
      tone: "text-destructive",
    },
    {
      title: "Net Cash Flow",
      value: formatMoney(savings),
      change: savings >= 0 ? "Surplus this month" : "Deficit this month",
      icon: PiggyBank,
      tone: savings >= 0 ? "text-success" : "text-destructive",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your financial overview for {monthLabel}
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={`rounded-3xl border p-6 shadow-sm ${healthTone}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${healthIconTone}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{statusLabel}</p>
                <p className="text-sm text-muted-foreground">{topSummary}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-semibold tracking-tight text-foreground">
                {formatMoney(savings)}
              </p>
              <p className="text-sm text-muted-foreground">
                {savings >= 0
                  ? "Keep the momentum by moving extra cash into goals or investments."
                  : `Spending is ${burnMultiple?.toFixed(1) ?? "0.0"}x income. Reduce ${formatMoney(
                      Math.abs(savings)
                    )} to break even.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/transactions"
                className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Review transactions
              </Link>
              <Link
                href="/budgets"
                className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Tighten budgets
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/70 p-4">
            <CashflowCard income={income} spending={expenses} />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {recoveryItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 + index * 0.05 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{item.title}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <item.icon className="h-4 w-4 text-foreground/70" />
              </div>
            </div>
            <p className={`mt-4 text-2xl font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 + index * 0.05 }}
            className="glass-card flex flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                <card.icon className="h-4 w-4 text-foreground/75" />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Needs Attention</h2>
                <p className="text-sm text-muted-foreground">
                  Clean up transaction data before making budget decisions.
                </p>
              </div>
              <Link href="/transactions" className="text-sm font-medium text-foreground hover:underline">
                Open ledger
              </Link>
            </div>
            <UncategorizedTransactions />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.24 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
                <p className="text-sm text-muted-foreground">
                  Inspect new inflows and outflows before they stack up.
                </p>
              </div>
              <Link href="/transactions" className="text-sm font-medium text-foreground hover:underline">
                See all
              </Link>
            </div>
            <RecentTransactions transactions={recent.data} />
          </motion.div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            className="glass-card rounded-2xl p-5"
          >
            <RecurringBillsWidget />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.26 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <p className="text-sm font-semibold text-amber-900">Recovery plan</p>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/80">
              <li>Cut or delay {formatMoney(Math.min(discretionarySpend, Math.abs(savings)))} from discretionary spend.</li>
              <li>Review the largest charge{largestExpense ? ` from ${largestExpense.merchant || "this merchant"}` : ""}.</li>
              <li>Use budgets to cap categories before the next billing cycle.</li>
            </ul>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthlyTrendChart />
        </div>
        <div className="lg:col-span-2">
          <CategoryComparisonChart />
        </div>
      </div>
    </div>
  );
}
