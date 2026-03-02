"use client";

import { useAccounts } from "@/lib/api/hooks";
import { AccountCard } from "@/components/accounts/account-card";
import { PlaidLinkButton } from "@/components/accounts/plaid-link-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark } from "lucide-react";

export default function AccountsPage() {
  const { data: accounts, isLoading, refetch } = useAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your connected bank accounts
          </p>
        </div>
        <PlaidLinkButton onSuccess={() => refetch()} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Landmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">No accounts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your bank to start tracking your finances.
          </p>
          <div className="mt-4">
            <PlaidLinkButton onSuccess={() => refetch()} />
          </div>
        </div>
      )}
    </div>
  );
}
