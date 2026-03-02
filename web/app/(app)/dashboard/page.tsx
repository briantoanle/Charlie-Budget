"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAccounts, useTransactions, useProfile } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatedNumber,
} from "@/components/ui/motion-primitives";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { HolidayBanner } from "@/components/dashboard/holiday-banner";
import { UncategorizedTransactions } from "@/components/dashboard/uncategorized-transactions";
import { SavingsGoalsWidget } from "@/components/dashboard/savings-goals-widget";
import { RecurringBillsWidget } from "@/components/dashboard/recurring-bills-widget";
import { Plus, RefreshCw, Landmark } from "lucide-react";

const MonthlyTrendChart = dynamic(
  () => import("@/components/dashboard/monthly-trend-chart").then((m) => m.MonthlyTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-lg skeleton-shimmer" /> }
);
const CategoryComparisonChart = dynamic(
  () => import("@/components/dashboard/category-comparison-chart").then((m) => m.CategoryComparisonChart),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-lg skeleton-shimmer" /> }
);

export default function DashboardPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: profile } = useProfile();
  const { data: txnData, isLoading: loadingTxns } = useTransactions({
    per_page: 5,
  });
  const [syncing, setSyncing] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);

  const totalBalance =
    accounts?.reduce((sum, a) => sum + (a.current_balance ?? 0), 0) ?? 0;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().slice(0, 10);

  const { data: monthTxns } = useTransactions({
    start_date: monthStart,
    end_date: today,
    per_page: 200,
  });

  const income =
    monthTxns?.data
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const spending =
    monthTxns?.data
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;

  const net = income - spending;

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const hasAccounts = (accounts?.length ?? 0) > 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/plaid/sync", { method: "POST" });
    } catch {
      // silent fail — user can retry
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ─── Header ────────────────────────────────────────── */}
        <FadeIn>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {greeting}
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s your financial overview
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Add Transaction — Phase 2 will wire up the modal */}
              <button
                onClick={() => setShowAddTxn(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-positive/30 bg-positive/10 px-3 py-2 text-xs font-medium text-positive transition-colors hover:bg-positive/20"
                title="Add Transaction"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
              {hasAccounts && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  title="Sync accounts"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Sync</span>
                </button>
              )}
            </div>
          </div>
        </FadeIn>

        {/* ─── Connect Bank CTA (empty state) ────────────────── */}
        {!loadingAccounts && !hasAccounts && (
          <FadeIn delay={0.05}>
            <div className="flex items-center gap-4 rounded-lg border border-dashed border-positive/30 bg-positive/5 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-positive/15">
                <Landmark className="h-5 w-5 text-positive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Connect your bank</p>
                <p className="text-xs text-muted-foreground">
                  Link an account with Plaid to automatically import
                  transactions and track your spending.
                </p>
              </div>
              <a
                href="/accounts"
                className="shrink-0 cursor-pointer rounded-lg bg-positive px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-positive/90"
              >
                Connect
              </a>
            </div>
          </FadeIn>
        )}

        {/* ─── Summary Cards ─────────────────────────────────── */}
        {loadingAccounts ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <Skeleton className="col-span-2 h-28 rounded-lg skeleton-shimmer lg:col-span-1" />
            <Skeleton className="h-28 rounded-lg skeleton-shimmer" />
            <Skeleton className="h-28 rounded-lg skeleton-shimmer" />
          </div>
        ) : (
          <StaggerList className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {/* Total Balance */}
            <StaggerItem className="col-span-2 lg:col-span-1">
              <div className="card-hover rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Balance
                </p>
                <AnimatedNumber
                  value={totalBalance}
                  format="currency"
                  className="mt-1.5 block font-mono text-2xl font-semibold font-tabular glow-positive sm:text-3xl"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Across {accounts?.length ?? 0} account
                  {accounts?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </StaggerItem>

            {/* Cashflow */}
            <StaggerItem>
              <div className="card-hover rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  This Month
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <AnimatedNumber
                    value={net}
                    format="currency"
                    decimals={0}
                    className={`font-mono text-2xl font-semibold font-tabular sm:text-3xl ${
                      net >= 0 ? "glow-positive" : "glow-destructive"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium uppercase ${
                      net >= 0 ? "text-positive" : "text-destructive"
                    }`}
                  >
                    {net >= 0 ? "surplus" : "deficit"}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
                  <span>
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-positive shadow-[0_0_6px_rgba(139,154,107,0.6)]" />
                    Income{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }).format(income)}
                  </span>
                  <span>
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_6px_rgba(224,122,95,0.6)]" />
                    Spent{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }).format(spending)}
                  </span>
                </div>
              </div>
            </StaggerItem>

            {/* Account count */}
            <StaggerItem>
              <div className="card-hover rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Accounts
                </p>
                <AnimatedNumber
                  value={accounts?.length ?? 0}
                  format="number"
                  decimals={0}
                  className="mt-1.5 block font-mono text-2xl font-semibold font-tabular sm:text-3xl"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {accounts?.filter((a) => a.source === "plaid").length ?? 0}{" "}
                  linked ·{" "}
                  {accounts?.filter((a) => a.source === "manual").length ?? 0}{" "}
                  manual
                </p>
              </div>
            </StaggerItem>
          </StaggerList>
        )}

        {/* ─── Charts ─────────────────────────────────────── */}
        <FadeIn delay={0.08}>
          <div className="grid gap-3 lg:grid-cols-2">
            <MonthlyTrendChart />
            <CategoryComparisonChart />
          </div>
        </FadeIn>

        {/* ─── Savings Goals ───────────────────────────────────── */}
        <FadeIn delay={0.09}>
          <SavingsGoalsWidget />
        </FadeIn>

        {/* ─── Recurring Bills ─────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <RecurringBillsWidget />
        </FadeIn>

        {/* ─── Holiday Banner ─────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <HolidayBanner country={profile?.country || "US"} />
        </FadeIn>

        {/* ─── Uncategorized Transactions ──────────────────────── */}
        <UncategorizedTransactions />

        {/* ─── Quick Links ───────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick Links
          </h2>
          <QuickLinks />
        </FadeIn>

        {/* ─── Recent Transactions ────────────────────────────── */}
        <FadeIn delay={0.15}>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>
          {loadingTxns ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          ) : txnData?.data && txnData.data.length > 0 ? (
            <StaggerList className="space-y-1" stagger={0.03}>
              {txnData.data.map((t) => (
                <StaggerItem key={t.id}>
                  <div className="card-hover flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.merchant || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.txn_date} · {t.category_name ?? "Uncategorized"}
                      </p>
                    </div>
                    <span
                      className={`ml-4 whitespace-nowrap font-mono text-sm font-medium font-tabular ${
                        t.amount > 0
                          ? "text-positive glow-positive"
                          : "text-foreground"
                      }`}
                    >
                      {t.amount > 0 ? "+" : ""}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(t.amount)}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No transactions yet. Connect a bank to get started.
            </div>
          )}
        </FadeIn>

        {/* ─── Add Transaction Modal ─────────────────────────── */}
        <AddTransactionModal open={showAddTxn} onClose={() => setShowAddTxn(false)} />

        {/* ─── Floating Action Button (FAB) ──────────────────── */}
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
          <button
            onClick={() => setShowAddTxn(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-positive text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 glow-positive"
            title="Add Transaction"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
