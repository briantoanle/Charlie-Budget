"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useSuspenseAccounts, useSuspenseTransactions } from "@/lib/api/hooks";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { CategoryComparisonChart } from "@/components/dashboard/category-comparison-chart";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

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

  const income = useMemo(
    () =>
      monthTransactions.data
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const expenses = useMemo(
    () =>
      monthTransactions.data
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [monthTransactions]
  );

  const savings = income - expenses;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cards = [
    {
      title: "Total Balance",
      value: formatMoney(totalBalance),
      change: `${accounts.length} account${accounts.length === 1 ? "" : "s"}`,
      icon: Wallet,
      tone: "text-foreground",
    },
    {
      title: "Income",
      value: formatMoney(income),
      change: "This month",
      icon: TrendingUp,
      tone: "text-success",
    },
    {
      title: "Expenses",
      value: formatMoney(expenses),
      change: "This month",
      icon: TrendingDown,
      tone: "text-destructive",
    },
    {
      title: "Savings",
      value: formatMoney(savings),
      change: savings >= 0 ? "Positive cash flow" : "Negative cash flow",
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
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
        <div className="lg:col-span-3">
          <MonthlyTrendChart />
        </div>
        <div className="lg:col-span-2">
          <CategoryComparisonChart />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
        </div>
        {recent.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-1">
            {recent.data.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.3 + i * 0.03 }}
                className="flex items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      tx.amount > 0 ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.merchant || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{tx.category_name || "Uncategorized"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-tabular text-sm font-semibold ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {formatMoney(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.txn_date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
