"use client";

import { useState } from "react";
import { useTransactions, useAccounts, useCategories } from "@/lib/api/hooks";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PageTransition,
  FadeIn,
  motion,
  AnimatePresence,
} from "@/components/ui/motion-primitives";

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 50,
    search: "",
    account_id: "",
    category_id: "",
    start_date: "",
    end_date: "",
  });

  const { data, isLoading } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const totalPages = data
    ? Math.ceil(data.pagination.total / data.pagination.per_page)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total ?? 0} transaction
            {data?.pagination.total !== 1 ? "s" : ""}
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <TransactionFilters
            filters={filters}
            accounts={accounts ?? []}
            categories={categories ?? []}
            onChange={(update) =>
              setFilters((prev) => ({ ...prev, ...update, page: 1 }))
            }
          />
        </FadeIn>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-12 rounded-lg skeleton-shimmer"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`page-${filters.page}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <TransactionTable transactions={data?.data ?? []} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {filters.page} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={filters.page <= 1}
                      onClick={() =>
                        setFilters((p) => ({ ...p, page: p.page - 1 }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={filters.page >= totalPages}
                      onClick={() =>
                        setFilters((p) => ({ ...p, page: p.page + 1 }))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
