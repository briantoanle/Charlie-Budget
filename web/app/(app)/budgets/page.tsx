"use client";

import { useState } from "react";
import {
  useBudget,
  useCategories,
  useCreateBudget,
  useCopyBudget,
  useAddBudgetLine,
  useUpdateBudgetLine,
  useDeleteBudgetLine,
} from "@/lib/api/hooks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";

function getMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(() =>
    getMonthStr(new Date())
  );

  const { data: budget, isLoading } = useBudget(currentMonth);
  const { data: categories } = useCategories();

  const createBudget = useCreateBudget();
  const copyBudget = useCopyBudget();
  const addLine = useAddBudgetLine();
  const updateLine = useUpdateBudgetLine();
  const deleteLine = useDeleteBudgetLine();

  const [addingLine, setAddingLine] = useState(false);
  const [newCatId, setNewCatId] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const prevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2);
    setCurrentMonth(getMonthStr(d));
  };
  const nextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m);
    setCurrentMonth(getMonthStr(d));
  };

  const handleCreateBudget = () => {
    createBudget.mutate({ month: currentMonth });
  };

  const handleCopyPrevious = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const prev = new Date(y, m - 2);
    copyBudget.mutate({
      source_month: getMonthStr(prev),
      target_month: currentMonth,
    });
  };

  const handleAddLine = () => {
    if (!newCatId || !newAmount || !budget) return;
    addLine.mutate(
      {
        budgetId: budget.id,
        category_id: newCatId,
        planned_amount: parseFloat(newAmount),
      },
      {
        onSuccess: () => {
          setNewCatId("");
          setNewAmount("");
          setAddingLine(false);
        },
      }
    );
  };

  const handleUpdateLine = (lineId: string) => {
    if (!budget || !editAmount) return;
    updateLine.mutate(
      {
        budgetId: budget.id,
        lineId,
        planned_amount: parseFloat(editAmount),
      },
      { onSuccess: () => setEditingLineId(null) }
    );
  };

  const handleDeleteLine = (lineId: string) => {
    if (!budget) return;
    deleteLine.mutate({ budgetId: budget.id, lineId });
  };

  // Categories not yet in budget
  const usedCatIds = new Set(budget?.lines.map((l) => l.category_id) ?? []);
  const availableCategories =
    categories?.filter((c) => !usedCatIds.has(c.id) && !c.archived) ?? [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const anyError =
    createBudget.error ||
    copyBudget.error ||
    addLine.error ||
    updateLine.error ||
    deleteLine.error;

  return (
    <div className="space-y-6">
      {/* Header with month navigator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set monthly budgets and track your spending
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[180px] text-center text-sm font-medium">
          {formatMonthLabel(currentMonth)}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {anyError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {anyError.message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !budget ? (
        /* No budget yet for this month */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="text-sm font-semibold">
            No budget for {formatMonthLabel(currentMonth)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new budget or copy from last month.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreateBudget} disabled={createBudget.isPending}>
              <Plus className="mr-1.5 h-4 w-4" />
              {createBudget.isPending ? "Creating…" : "Start Fresh"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyPrevious}
              disabled={copyBudget.isPending}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              {copyBudget.isPending ? "Copying…" : "Copy Previous"}
            </Button>
          </div>
        </div>
      ) : (
        /* Budget exists — show lines */
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Planned
              </p>
              <p className="font-mono text-xl font-semibold font-tabular">
                {fmt(budget.totals.planned)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actual
              </p>
              <p className="font-mono text-xl font-semibold font-tabular">
                {fmt(budget.totals.actual)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Remaining
              </p>
              <p
                className={`font-mono text-xl font-semibold font-tabular ${
                  budget.totals.planned - budget.totals.actual >= 0
                    ? "text-positive"
                    : "text-destructive"
                }`}
              >
                {fmt(budget.totals.planned - budget.totals.actual)}
              </p>
            </div>
          </div>

          {/* Budget lines */}
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {budget.lines.map((line) => {
              const pct =
                line.planned_amount > 0
                  ? Math.min(
                      100,
                      (line.actual_amount / line.planned_amount) * 100
                    )
                  : 0;
              const isOver = line.actual_amount > line.planned_amount;
              const isEditing = editingLineId === line.id;

              return (
                <div key={line.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {line.category_name}
                    </span>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-7 w-24 font-mono text-right"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleUpdateLine(line.id)
                            }
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleUpdateLine(line.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setEditingLineId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-muted-foreground font-tabular">
                            {fmt(line.actual_amount)} / {fmt(line.planned_amount)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingLineId(line.id);
                              setEditAmount(String(line.planned_amount));
                            }}
                          >
                            <span className="text-xs">✎</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteLine(line.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? "bg-destructive" : "bg-positive"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {budget.lines.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No budget lines yet. Add a category below.
              </div>
            )}
          </div>

          {/* Add line */}
          {addingLine ? (
            <div className="flex items-end gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <Select value={newCatId} onValueChange={setNewCatId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px] space-y-1">
                <label className="text-xs text-muted-foreground">Planned</label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="500"
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleAddLine()}
                />
              </div>
              <Button onClick={handleAddLine} disabled={addLine.isPending}>
                {addLine.isPending ? "Adding…" : "Add"}
              </Button>
              <Button variant="ghost" onClick={() => setAddingLine(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddingLine(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Category Line
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
