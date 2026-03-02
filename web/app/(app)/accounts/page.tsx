"use client";

import { useAccounts } from "@/lib/api/hooks";
import { AccountCard } from "@/components/accounts/account-card";
import { PlaidLinkButton } from "@/components/accounts/plaid-link-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark } from "lucide-react";
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
  CardHover,
} from "@/components/ui/motion-primitives";

export default function AccountsPage() {
  const { data: accounts, isLoading, refetch } = useAccounts();

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Accounts
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your connected bank accounts
              </p>
            </div>
            <PlaidLinkButton onSuccess={() => refetch()} />
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <StaggerItem key={account.id}>
                <CardHover>
                  <AccountCard account={account} />
                </CardHover>
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <FadeIn delay={0.15}>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                <Landmark className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">No accounts yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Connect your bank to start tracking your finances automatically.
              </p>
              <div className="mt-5">
                <PlaidLinkButton onSuccess={() => refetch()} />
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
