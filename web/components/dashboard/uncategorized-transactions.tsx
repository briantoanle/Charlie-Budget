"use client";

import {
  useTransactions,
  useCategories,
  useUpdateTransaction,
} from "@/lib/api/hooks";
import { FadeIn } from "@/components/ui/motion-primitives";
import { AlertCircle } from "lucide-react";

export function UncategorizedTransactions() {
  const { data: txnData } = useTransactions({
    category_id: "uncategorized",
    per_page: 5,
  });
  const { data: categories } = useCategories();
  const updateTxn = useUpdateTransaction();

  const uncategorized = txnData?.data ?? [];

  if (uncategorized.length === 0) return null;

  const handleCategorize = (txnId: string, categoryId: string) => {
    if (!categoryId) return;
    updateTxn.mutate({ id: txnId, category_id: categoryId });
  };

  return (
    <FadeIn delay={0.12}>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Needs Attention
          </h3>
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
            {uncategorized.length}
          </span>
        </div>
        <div className="space-y-2">
          {uncategorized.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.merchant || "Unknown"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.txn_date} ·{" "}
                  <span
                    className={`font-mono font-tabular ${
                      t.amount < 0 ? "text-destructive" : "text-positive"
                    }`}
                  >
                    {t.amount < 0 ? "-" : "+"}$
                    {Math.abs(t.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </div>
              <select
                defaultValue=""
                onChange={(e) => handleCategorize(t.id, e.target.value)}
                className="w-28 shrink-0 cursor-pointer rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring sm:w-36"
              >
                <option value="" disabled>
                  Category…
                </option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
