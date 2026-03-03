"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useBudget,
  useCategories,
  useCreateBudget,
  useCopyBudget,
  useAddBudgetLine,
  useUpdateBudgetLine,
  useDeleteBudgetLine,
  useCreateCategory,
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
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatedNumber,
  AnimatedProgressBar,
  SlideIn,
  motion,
  AnimatePresence,
} from "@/components/ui/motion-primitives";

function getMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function BudgetsPage() {
  const router = useRouter();
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
  const createCategory = useCreateCategory();

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
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Budgets
              </h1>
              <p className="text-sm text-muted-foreground">
                Set monthly budgets and track your spending
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Month navigator */}
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentMonth}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="min-w-[180px] text-center text-sm font-medium"
              >
                {formatMonthLabel(currentMonth)}
              </motion.span>
            </AnimatePresence>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </FadeIn>

        {anyError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {anyError.message}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-14 rounded-lg skeleton-shimmer"
                />
              ))}
            </motion.div>
          ) : !categories || categories.length === 0 ? (
            /* No categories yet */
            <motion.div
              key="no-categories"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">First, create some categories</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  You need categories to start budgeting. Create your own or pick some common ones to get started quickly.
                </p>
                
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { name: "Housing", icon: "🏠" },
                    { name: "Food & Groceries", icon: "🍏" },
                    { name: "Transportation", icon: "🚗" },
                    { name: "Utilities", icon: "⚡" },
                    { name: "Entertainment", icon: "🍿" },
                    { name: "Shopping", icon: "🛍️" },
                  ].map((cat) => (
                    <Button
                      key={cat.name}
                      variant="outline"
                      className="h-auto flex-col gap-1 py-3 px-4 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all"
                      onClick={() => 
                        createCategory.mutate({ name: cat.name, kind: "expense" })
                      }
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.name}</span>
                    </Button>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="link"
                  className="mt-4"
                  onClick={() => router.push("/categories")}
                >
                  Go to Categories page to create custom ones
                </Button>
              </div>
            </motion.div>
          ) : !budget ? (
            /* No budget yet */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                <h3 className="text-sm font-semibold">
                  No budget for {formatMonthLabel(currentMonth)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new budget or copy from last month.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleCreateBudget}
                    disabled={createBudget.isPending}
                  >
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
            </motion.div>
          ) : (
            /* Budget exists */
            <motion.div
              key={`budget-${budget.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Summary bar */}
              <StaggerList className="grid grid-cols-3 gap-4">
                <StaggerItem>
                  <div className="card-hover rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Planned
                    </p>
                    <AnimatedNumber
                      value={budget.totals.planned}
                      format="currency"
                      decimals={0}
                      className="mt-1 block font-mono text-xl font-semibold font-tabular"
                    />
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="card-hover rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actual
                    </p>
                    <AnimatedNumber
                      value={budget.totals.actual}
                      format="currency"
                      decimals={0}
                      className="mt-1 block font-mono text-xl font-semibold font-tabular"
                    />
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="card-hover rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Remaining
                    </p>
                    <AnimatedNumber
                      value={budget.totals.planned - budget.totals.actual}
                      format="currency"
                      decimals={0}
                      className={`mt-1 block font-mono text-xl font-semibold font-tabular ${
                        budget.totals.planned - budget.totals.actual >= 0
                          ? "text-positive glow-positive"
                          : "text-destructive glow-destructive"
                      }`}
                    />
                  </div>
                </StaggerItem>
              </StaggerList>

              {/* Budget lines */}
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {budget.lines.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No budget lines yet. Add a category below.
                  </div>
                ) : (
                  <StaggerList>
                    {budget.lines.map((line) => {
                      const pct =
                        line.planned_amount > 0
                          ? Math.min(
                              100,
                              (line.actual_amount / line.planned_amount) * 100
                            )
                          : 0;
                      const isOver =
                        line.actual_amount > line.planned_amount;
                      const isEditing = editingLineId === line.id;

                      return (
                        <StaggerItem key={line.id}>
                          <div className="px-4 py-3 space-y-2">
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
                                      onChange={(e) =>
                                        setEditAmount(e.target.value)
                                      }
                                      className="h-7 w-24 font-mono text-right"
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleUpdateLine(line.id)
                                      }
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs"
                                      onClick={() =>
                                        handleUpdateLine(line.id)
                                      }
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
                                      {fmt(line.actual_amount)} /{" "}
                                      {fmt(line.planned_amount)}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setEditingLineId(line.id);
                                        setEditAmount(
                                          String(line.planned_amount)
                                        );
                                      }}
                                    >
                                      <span className="text-xs">✎</span>
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        handleDeleteLine(line.id)
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Animated progress bar */}
                            <AnimatedProgressBar
                              percent={pct}
                              className="h-1.5 w-full rounded-full bg-muted"
                              barClassName={`h-full rounded-full ${
                                isOver ? "bg-destructive" : "bg-positive"
                              }`}
                            />
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerList>
                )}
              </div>

              {/* Add line */}
              <AnimatePresence>
                {addingLine ? (
                  <SlideIn direction="down">
                    <div className="flex items-end gap-3 rounded-lg border border-border bg-card p-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Category
                        </label>
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
                        <label className="text-xs text-muted-foreground">
                          Planned
                        </label>
                        <Input
                          type="number"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          placeholder="500"
                          className="font-mono"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddLine()
                          }
                        />
                      </div>
                      <Button
                        onClick={handleAddLine}
                        disabled={addLine.isPending}
                      >
                        {addLine.isPending ? "Adding…" : "Add"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setAddingLine(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </SlideIn>
                ) : null}
              </AnimatePresence>

              {!addingLine && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAddingLine(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Category Line
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
