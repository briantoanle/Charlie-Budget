import type { TransactionResponse } from "@/lib/api/hooks";

interface RecentTransactionsProps {
  transactions: TransactionResponse[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No transactions yet. Connect a bank account to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {transactions.map((txn) => {
        const isExpense = txn.amount < 0;
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: txn.currency,
          minimumFractionDigits: 2,
        }).format(Math.abs(txn.amount));

        return (
          <div
            key={txn.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {txn.merchant || "Unknown"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{txn.txn_date}</span>
                {txn.category_name && (
                  <>
                    <span>·</span>
                    <span>{txn.category_name}</span>
                  </>
                )}
              </div>
            </div>
            <span
              className={`ml-4 font-mono text-sm font-medium font-tabular ${
                isExpense ? "text-destructive" : "text-positive"
              }`}
            >
              {isExpense ? "-" : "+"}
              {formatted}
            </span>
          </div>
        );
      })}
    </div>
  );
}
