import type { AccountResponse } from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface AccountCardProps {
  account: AccountResponse;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const balance = account.current_balance
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: account.currency,
        minimumFractionDigits: 2,
      }).format(account.current_balance)
    : "—";

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-5 space-y-3 cursor-pointer transition-colors hover:bg-accent/40 hover:border-border/80"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{account.name}</p>
          {account.institution_name && (
            <p className="text-xs text-muted-foreground">
              {account.institution_name}
            </p>
          )}
        </div>
        <Badge
          variant={account.source === "plaid" ? "default" : "secondary"}
          className="ml-2 shrink-0 text-[10px]"
        >
          {account.type}
        </Badge>
      </div>

      <p className="font-mono text-2xl font-semibold font-tabular">{balance}</p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {account.needs_reauth && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            Needs re-auth
          </span>
        )}
        {account.last_synced_at && (
          <span>
            Synced{" "}
            {new Date(account.last_synced_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
