"use client";

import { useAccounts, useTransactions } from "@/lib/api/hooks";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { CashflowCard } from "@/components/dashboard/cashflow-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loadingAccounts ? (
          <>
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </>
        ) : (
          <>
            <BalanceCard
              totalBalance={totalBalance}
              accountCount={accounts?.length ?? 0}
            />
            <CashflowCard income={income} spending={spending} />
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Accounts
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold font-tabular">
                {accounts?.length ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {accounts?.filter((a) => a.source === "plaid").length ?? 0}{" "}
                linked · {accounts?.filter((a) => a.source === "manual").length ?? 0}{" "}
                manual
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Recent Transactions
        </h2>
        {loadingTxns ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <RecentTransactions transactions={txnData?.data ?? []} />
        )}
      </div>
    </div>
  );
}
