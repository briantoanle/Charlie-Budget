"use client";

import { useSavingsGoals } from "@/lib/api/hooks";
import { 
  StaggerList, 
  StaggerItem,
  AnimatedNumber
} from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function SavingsGoalsWidget() {
  const { data: goals, isLoading } = useSavingsGoals();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg skeleton-shimmer" />
        <Skeleton className="h-24 w-full rounded-lg skeleton-shimmer" />
      </div>
    );
  }

  const hasGoals = (goals?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Savings Goals
        </h2>
        <button className="text-xs text-positive hover:underline flex items-center gap-1">
          <Plus className="h-3 w-3" />
          New Goal
        </button>
      </div>

      {!hasGoals ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <PiggyBank className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            No goals set yet. Start saving for something special.
          </p>
        </div>
      ) : (
        <StaggerList className="grid gap-3 sm:grid-cols-2">
          {goals?.map((goal) => {
            const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
            return (
              <StaggerItem key={goal.id}>
                <div className="card-hover relative overflow-hidden rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{goal.emoji || "🎯"}</span>
                        <p className="text-sm font-semibold">{goal.name}</p>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <AnimatedNumber 
                          value={goal.current_amount} 
                          format="currency" 
                          className="text-lg font-bold font-tabular"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          of {new Intl.NumberFormat("en-US", { 
                            style: "currency", 
                            currency: goal.currency 
                          }).format(goal.target_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-xs font-bold",
                        progress >= 100 ? "text-positive" : "text-muted-foreground"
                      )}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        progress >= 100 ? "bg-positive glow-positive" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
