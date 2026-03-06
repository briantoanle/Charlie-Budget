"use client";

import { useMemo } from "react";
import { ArrowUpRight, ArrowDownLeft, Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useTransactions } from "@/lib/api/hooks";
import type { AccountResponse } from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AccountTransactionsModalProps {
  account: AccountResponse | null;
  open: boolean;
  onClose: () => void;
}

export function AccountTransactionsModal({
  account,
  open,
  onClose,
}: AccountTransactionsModalProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactions(
      account ? { account_id: account.id, per_page: 30 } : { per_page: 0 },
    );

  const transactions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const balance = account?.current_balance
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: account.currency,
        minimumFractionDigits: 2,
      }).format(account.current_balance)
    : "—";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        {/* Full-screen dim overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "duration-200",
          )}
        />

        {/* Centered modal panel */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            // Base: fixed, centered, solid card surface
            "fixed z-[60] flex flex-col",
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100vw-2rem)] max-w-2xl",
            "h-[min(88vh,720px)]",
            "rounded-2xl border border-border bg-card shadow-2xl outline-none",
            // Animations
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {account?.name ?? "Account"} Transactions
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
            <div>
              <h2 className="text-base font-semibold leading-none">
                {account?.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {account?.institution_name}
                {account?.type && (
                  <> &middot; <span className="capitalize">{account.type}</span></>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xl font-semibold tabular-nums">
                {balance}
              </p>
              <DialogPrimitive.Close
                className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 hover:bg-accent focus:outline-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Scrollable transaction list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No transactions for this account.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
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
                        <p className="text-sm font-medium">
                          {tx.merchant || "Unknown"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-md px-1.5 py-0 text-[10px] font-medium"
                          >
                            {tx.category_name ?? "Uncategorized"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tx.txn_date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      className={`font-tabular text-sm font-semibold tabular-nums ${
                        tx.amount > 0 ? "text-success" : "text-foreground"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}$
                      {Math.abs(tx.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {hasNextPage && (
              <div className="px-6 py-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    `Load more (${totalCount - transactions.length} remaining)`
                  )}
                </button>
              </div>
            )}

            {!isLoading && transactions.length > 0 && !hasNextPage && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                All {totalCount} transactions
              </p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
