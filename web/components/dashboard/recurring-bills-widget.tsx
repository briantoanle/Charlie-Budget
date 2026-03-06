"use client";

import { useTransactions } from "@/lib/api/hooks";
import {
  StaggerList,
  StaggerItem
} from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface RecurringBill {
  id: string;
  merchant: string;
  amount: number;
  frequency: "monthly" | "weekly";
  nextDate: string;
  daysRemaining: number;
}

export function RecurringBillsWidget() {
  const { data: txnData, isLoading } = useTransactions({ per_page: 200 });

  const bills = useMemo(() => {
    const txns = txnData?.pages?.flatMap((p) => p.data);
    if (!txns?.length) return [];

    // SIMPLE PATTERN DETECTION
    // Groups transactions by merchant and checks for regular intervals
    const groups: Record<string, typeof txns> = {};
    txns.forEach(t => {
      if (t.amount < 0) {
        if (!groups[t.merchant || "Unknown"]) groups[t.merchant || "Unknown"] = [];
        groups[t.merchant || "Unknown"].push(t);
      }
    });

    const detectedBills: RecurringBill[] = [];
    const now = new Date();

    Object.entries(groups).forEach(([merchant, txns]) => {
      if (txns.length < 2) return;
      
      // Sort by date desc
      txns.sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());
      
      const lastTxn = txns[0];
      const prevTxn = txns[1];
      
      const lastDate = new Date(lastTxn.txn_date);
      const prevDate = new Date(prevTxn.txn_date);
      
      const diffDays = Math.round((lastDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Heuristic: 27-32 days = monthly
      if (diffDays >= 27 && diffDays <= 33) {
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        const daysRemaining = Math.max(0, Math.round((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        detectedBills.push({
          id: merchant,
          merchant,
          amount: Math.abs(lastTxn.amount),
          frequency: "monthly",
          nextDate: nextDate.toISOString().split("T")[0],
          daysRemaining
        });
      }
    });

    return detectedBills.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 3);
  }, [txnData]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg skeleton-shimmer" />
      </div>
    );
  }

  const hasBills = bills.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Upcoming Bills
        </h2>
        {hasBills && (
          <span className="text-[10px] bg-accent/50 px-1.5 py-0.5 rounded text-muted-foreground">
            {bills.length} Predicted
          </span>
        )}
      </div>

      {!hasBills ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            No recurring bills detected yet.
          </p>
        </div>
      ) : (
        <StaggerList className="grid gap-2">
          {bills.map((bill) => (
            <StaggerItem key={bill.id}>
              <div className="card-hover flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    bill.daysRemaining <= 3 ? "bg-destructive/10 text-destructive" : "bg-accent text-muted-foreground"
                  )}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{bill.merchant}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {bill.daysRemaining === 0 ? "Due today" : 
                       bill.daysRemaining === 1 ? "Due tomorrow" : 
                       `Due in ${bill.daysRemaining} days`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-tabular">
                    {new Intl.NumberFormat("en-US", { 
                      style: "currency", 
                      currency: "USD" 
                    }).format(bill.amount)}
                  </p>
                  <button className="text-[10px] text-positive flex items-center gap-0.5 justify-end hover:underline">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Paid
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
