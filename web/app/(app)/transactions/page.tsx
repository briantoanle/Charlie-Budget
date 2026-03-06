"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useTransactions, useAccounts } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpRight, ArrowDownLeft, Plus, Loader2, X } from "lucide-react";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    per_page: 20,
    search: "",
    account_id: searchParams.get("account_id") ?? "",
    category_id: "",
    start_date: "",
    end_date: "",
  });

  const { data: accounts } = useAccounts();
  const activeAccount = filters.account_id
    ? accounts?.find((a) => a.id === filters.account_id)
    : null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactions(filters);

  const transactions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses };
  }, [transactions]);

  const hasActiveFilters =
    !!filters.search || !!filters.start_date || !!filters.end_date || !!filters.account_id;

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all your transactions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Transactions</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{totalCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Income</p>
          <p className="mt-1 text-xl font-semibold text-success">
            +${totals.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Expenses</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            -${totals.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="glass-card space-y-4 rounded-2xl p-4">
        {activeAccount && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtered by account:</span>
            <Badge variant="secondary" className="gap-1.5 pl-2 pr-1 py-1 text-xs">
              {activeAccount.name}
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, account_id: "" }));
                  router.replace("/transactions");
                }}
                className="rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search merchant, note, or category..."
            className="h-10 rounded-xl border-border/50 bg-secondary/50 pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              disabled={!hasActiveFilters}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  search: "",
                  start_date: "",
                  end_date: "",
                  account_id: "",
                }));
                router.replace("/transactions");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading transactions...</div>
        ) : transactions.length ? (
          <div className="divide-y divide-border/50">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 20) * 0.02 }}
                className="flex cursor-default items-center justify-between px-5 py-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
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
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
                        {tx.category_name ?? "Uncategorized"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{tx.txn_date}</span>
                    </div>
                  </div>
                </div>
                <p className={`font-tabular text-sm font-semibold ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                  {tx.amount > 0 ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions match your current filters.</p>
            <p className="text-xs text-muted-foreground">
              Try widening your date range or clearing the search.
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}

        {!isLoading && transactions.length > 0 && !hasNextPage && (
          <div className="py-3 text-center text-xs text-muted-foreground">
            All {totalCount} transactions loaded
          </div>
        )}
      </div>
      <AddTransactionModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
