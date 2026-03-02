"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAccounts, useCategories, useCreateTransaction } from "@/lib/api/hooks";
import { Loader2 } from "lucide-react";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ open, onClose }: AddTransactionModalProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createTxn = useCreateTransaction();

  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    amount: "",
    merchant: "",
    note: "",
    txn_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.txn_date) return;

    try {
      await createTxn.mutateAsync({
        account_id: formData.account_id,
        category_id: formData.category_id || undefined,
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        note: formData.note,
        txn_date: formData.txn_date,
      });
      onClose();
      // Reset form
      setFormData({
        account_id: "",
        category_id: "",
        amount: "",
        merchant: "",
        note: "",
        txn_date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border/40 bg-card/80 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="account">Account</Label>
            <Select 
              value={formData.account_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, account_id: v }))}
            >
              <SelectTrigger id="account" className="bg-background/50 border-border/40">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.txn_date}
                onChange={(e) => setFormData(prev => ({ ...prev, txn_date: e.target.value }))}
                className="bg-background/50 border-border/40"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-background/50 border-border/40"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              placeholder="e.g. Starbucks"
              value={formData.merchant}
              onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
              className="bg-background/50 border-border/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
            >
              <SelectTrigger id="category" className="bg-background/50 border-border/40">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="Added some extra shots"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="bg-background/50 border-border/40"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-border/40"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTxn.isPending || !formData.account_id || !formData.amount}
              className="bg-positive text-primary-foreground hover:bg-positive/90"
            >
              {createTxn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
