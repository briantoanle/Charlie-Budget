"use client";

import { useAccounts, useTransactions } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatedNumber,
} from "@/components/ui/motion-primitives";

export default function DashboardPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: txnData, isLoading: loadingTxns } = useTransactions({
    per_page: 5,
  });

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

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your financial overview
          </p>
        </FadeIn>

        {/* Summary cards */}
        {loadingAccounts ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 rounded-lg skeleton-shimmer" />
            <Skeleton className="h-32 rounded-lg skeleton-shimmer" />
            <Skeleton className="h-32 rounded-lg skeleton-shimmer" />
          </div>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Balance */}
            <StaggerItem>
              <div className="card-hover rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Balance
                </p>
                <AnimatedNumber
                  value={totalBalance}
                  format="currency"
                  className="mt-2 block font-mono text-3xl font-semibold font-tabular glow-positive"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Across {accounts?.length ?? 0} account
                  {accounts?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </StaggerItem>

            {/* Cashflow */}
            <StaggerItem>
              <div className="card-hover rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  This Month
                </p>
                <div className="mt-2 flex items-baseline gap-3">
                  <AnimatedNumber
                    value={net}
                    format="currency"
                    decimals={0}
                    className={`font-mono text-3xl font-semibold font-tabular ${
                      net >= 0 ? "glow-positive" : "glow-destructive"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      net >= 0 ? "text-positive" : "text-destructive"
                    }`}
                  >
                    {net >= 0 ? "surplus" : "deficit"}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
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
              <div className="card-hover rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Accounts
                </p>
                <AnimatedNumber
                  value={accounts?.length ?? 0}
                  format="number"
                  decimals={0}
                  className="mt-2 block font-mono text-3xl font-semibold font-tabular"
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

        {/* Recent transactions */}
        <FadeIn delay={0.3}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>
          {loadingTxns ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          ) : txnData?.data && txnData.data.length > 0 ? (
            <StaggerList className="space-y-1" stagger={0.04}>
              {txnData.data.map((t) => (
                <StaggerItem key={t.id}>
                  <div className="card-hover flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.date} · {t.category_name ?? "Uncategorized"}
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
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Connect a bank to get started.
            </div>
          )}
        </FadeIn>
      </div>
    </PageTransition>
  );
}
