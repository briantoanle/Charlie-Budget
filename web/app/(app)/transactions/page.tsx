"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTransactions } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 12,
    search: "",
    account_id: "",
    category_id: "",
    start_date: "",
    end_date: "",
  });

  const { data, isLoading } = useTransactions(filters);
  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.per_page)) : 1;

  const totals = useMemo(() => {
    const transactions = data?.data ?? [];
    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, count: transactions.length };
  }, [data]);
  const hasActiveFilters =
    !!filters.search || !!filters.start_date || !!filters.end_date;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage all your transactions</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Transactions</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{totals.count}</p>
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
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
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
              onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value, page: 1 }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value, page: 1 }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              disabled={!hasActiveFilters}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  search: "",
                  start_date: "",
                  end_date: "",
                  page: 1,
                }))
              }
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading transactions...</div>
        ) : data?.data.length ? (
          <div className="divide-y divide-border/50">
            {data.data.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
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

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Page {filters.page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
