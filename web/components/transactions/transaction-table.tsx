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

interface TransactionTableProps {
  transactions: TransactionResponse[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
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
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead className="hidden md:table-cell">Account</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
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
              <TableRow key={txn.id}>
                <TableCell className="text-xs text-muted-foreground font-mono font-tabular">
                  {txn.txn_date}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {txn.merchant || "Unknown"}
                    </p>
                    {txn.note && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {txn.note}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {txn.account_name}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {txn.category_name ? (
                    <Badge variant="secondary" className="text-[10px]">
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
  );
}
