"use client";

import { useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { TransactionResponse } from "@/lib/api/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ColumnKey = "date" | "merchant" | "account" | "category" | "amount";

const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  date: 110,
  merchant: 360,
  account: 220,
  category: 170,
  amount: 140,
};

const MIN_WIDTHS: Record<ColumnKey, number> = {
  date: 96,
  merchant: 220,
  account: 160,
  category: 140,
  amount: 120,
};

interface TransactionTableProps {
  transactions: TransactionResponse[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [columnWidths, setColumnWidths] = useState(DEFAULT_WIDTHS);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null);

  const columnStyles = useMemo<Record<ColumnKey, CSSProperties>>(
    () => ({
      date: { width: columnWidths.date, minWidth: columnWidths.date },
      merchant: { width: columnWidths.merchant, minWidth: columnWidths.merchant },
      account: { width: columnWidths.account, minWidth: columnWidths.account },
      category: { width: columnWidths.category, minWidth: columnWidths.category },
      amount: { width: columnWidths.amount, minWidth: columnWidths.amount },
    }),
    [columnWidths]
  );

  const startResize = (column: ColumnKey, event: ReactPointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(MIN_WIDTHS[column], startWidth + moveEvent.clientX - startX);
      setColumnWidths((current) => ({ ...current, [column]: nextWidth }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No transactions match your filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table className="table-fixed min-w-[1000px]">
          <colgroup>
            <col style={columnStyles.date} />
            <col style={columnStyles.merchant} />
            <col style={columnStyles.account} />
            <col style={columnStyles.category} />
            <col style={columnStyles.amount} />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <ResizableHead
                label="Date"
                width={columnWidths.date}
                onResizeStart={(event) => startResize("date", event)}
              />
              <ResizableHead
                label="Merchant"
                width={columnWidths.merchant}
                onResizeStart={(event) => startResize("merchant", event)}
              />
              <ResizableHead
                label="Account"
                width={columnWidths.account}
                className="hidden md:table-cell"
                onResizeStart={(event) => startResize("account", event)}
              />
              <ResizableHead
                label="Category"
                width={columnWidths.category}
                className="hidden sm:table-cell"
                onResizeStart={(event) => startResize("category", event)}
              />
              <ResizableHead
                label="Amount"
                width={columnWidths.amount}
                className="text-right"
                onResizeStart={(event) => startResize("amount", event)}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => {
              const isExpense = txn.amount < 0;
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: txn.currency,
                minimumFractionDigits: 2,
              }).format(Math.abs(txn.amount));

              return (
                <TableRow
                  key={txn.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTransaction(txn)}
                >
                  <TableCell className="font-mono text-xs font-tabular text-muted-foreground">
                    {txn.txn_date}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="truncate text-sm font-medium">
                        {txn.merchant || "Unknown"}
                      </p>
                      {txn.note && (
                        <p className="truncate text-xs text-muted-foreground">
                          {txn.note}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="block truncate text-xs text-muted-foreground">
                      {txn.account_name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {txn.category_name ? (
                      <Badge variant="secondary" className="max-w-full truncate text-[10px]">
                        {txn.category_name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-mono text-sm font-medium font-tabular ${
                        isExpense ? "text-destructive" : "text-positive"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatted}
                    </span>
                    {txn.pending && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[9px] text-muted-foreground"
                      >
                        pending
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedTransaction !== null} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        {selectedTransaction && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTransaction.merchant || "Unknown transaction"}</DialogTitle>
              <DialogDescription>
                Full transaction detail from the drill-down report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Date" value={selectedTransaction.txn_date} mono />
              <DetailField
                label="Amount"
                value={`${selectedTransaction.amount < 0 ? "-" : "+"}${new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: selectedTransaction.currency,
                  minimumFractionDigits: 2,
                }).format(Math.abs(selectedTransaction.amount))}`}
                tone={selectedTransaction.amount < 0 ? "negative" : "positive"}
                mono
              />
              <DetailField label="Account" value={selectedTransaction.account_name} />
              <DetailField label="Category" value={selectedTransaction.category_name ?? "Uncategorized"} />
              <DetailField label="Source" value={selectedTransaction.source} />
              <DetailField label="Status" value={selectedTransaction.pending ? "Pending" : "Posted"} />
            </div>
            {selectedTransaction.note && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Note</p>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm leading-6">
                  {selectedTransaction.note}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Transaction ID</p>
              <p className="break-all rounded-xl border border-border/70 bg-muted/20 p-3 font-mono text-xs">
                {selectedTransaction.id}
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function ResizableHead({
  label,
  width,
  className,
  onResizeStart,
}: {
  label: string;
  width: number;
  className?: string;
  onResizeStart: (event: ReactPointerEvent<HTMLSpanElement>) => void;
}) {
  return (
    <TableHead className={className} style={{ width, minWidth: width }}>
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${label} column`}
          className="ml-auto h-5 w-2 cursor-col-resize rounded-full bg-border/70 transition-colors hover:bg-border"
          onPointerDown={onResizeStart}
        />
      </div>
    </TableHead>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p
        className={[
          "rounded-xl border border-border/70 bg-muted/20 p-3 text-sm",
          mono ? "font-mono font-tabular" : "",
          tone === "positive" ? "text-positive" : "",
          tone === "negative" ? "text-destructive" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
