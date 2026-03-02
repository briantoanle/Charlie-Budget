interface CashflowCardProps {
  income: number;
  spending: number;
}

export function CashflowCard({ income, spending }: CashflowCardProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const net = income - spending;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        This Month
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-mono text-3xl font-semibold font-tabular">
          {fmt(net)}
        </span>
        <span
          className={`text-xs font-medium ${net >= 0 ? "text-positive" : "text-destructive"}`}
        >
          {net >= 0 ? "surplus" : "deficit"}
        </span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive mr-1" />
          Income {fmt(income)}
        </span>
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive mr-1" />
          Spent {fmt(spending)}
        </span>
      </div>
    </div>
  );
}
