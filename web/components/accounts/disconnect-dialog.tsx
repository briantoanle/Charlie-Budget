"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, Trash2, Loader2 } from "lucide-react";
import { useDisconnectPlaidItem } from "@/lib/api/hooks";

interface DisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plaidItemId: string;
  institutionName: string;
}

export function DisconnectDialog({
  open,
  onOpenChange,
  plaidItemId,
  institutionName,
}: DisconnectDialogProps) {
  const disconnectItem = useDisconnectPlaidItem();
  const [selectedAction, setSelectedAction] = useState<"archive" | "delete" | null>(
    null
  );

  const handleAction = (action: "archive" | "delete") => {
    setSelectedAction(action);
    disconnectItem.mutate(
      { plaid_item_id: plaidItemId, action },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedAction(null);
        },
        onError: () => {
          setSelectedAction(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !disconnectItem.isPending && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Disconnect {institutionName}</DialogTitle>
          <DialogDescription>
            Choose how you want to handle your existing data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div
            className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => !disconnectItem.isPending && handleAction("archive")}
          >
            <div className="flex items-center gap-2 font-medium">
              <Archive className="h-4 w-4 text-blue-500" />
              Unlink and Archive
            </div>
            <p className="text-sm text-muted-foreground">
              Stop syncing new transactions, but keep your accounts and historical data so your past budgets stay accurate. Recommended.
            </p>
            {selectedAction === "archive" && disconnectItem.isPending && (
              <div className="flex items-center text-xs text-blue-500 mt-1">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Unlinking...
              </div>
            )}
          </div>

          <div
            className="flex flex-col gap-2 rounded-lg border border-destructive/20 p-4 hover:bg-destructive/5 transition-colors cursor-pointer"
            onClick={() => !disconnectItem.isPending && handleAction("delete")}
          >
            <div className="flex items-center gap-2 font-medium text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Everything
            </div>
            <p className="text-sm text-muted-foreground">
              Completely remove this bank connection and permanently delete all associated accounts and transactions. Irreversible.
            </p>
            {selectedAction === "delete" && disconnectItem.isPending && (
              <div className="flex items-center text-xs text-destructive mt-1">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Deleting...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
