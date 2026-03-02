interface BalanceCardProps {
  totalBalance: number;
  accountCount: number;
}

export function BalanceCard({ totalBalance, accountCount }: BalanceCardProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(totalBalance);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Total Balance
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold font-tabular">
        {formatted}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Across {accountCount} account{accountCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
