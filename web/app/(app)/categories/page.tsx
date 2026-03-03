"use client";

import { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Check,
  X,
} from "lucide-react";
import {
  PageTransition,
  FadeIn,
  SlideIn,
  StaggerList,
  StaggerItem,
  AnimatePresence,
} from "@/components/ui/motion-primitives";

export default function CategoriesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: categories, isLoading } = useCategories(showArchived);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("expense");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), kind: newKind },
      {
        onSuccess: () => {
          setNewName("");
          setCreating(false);
        },
      }
    );
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, name: editName.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleToggleArchive = (id: string, currentlyArchived: boolean) => {
    updateMutation.mutate({ id, archived: !currentlyArchived });
  };

  const expenseCategories = categories?.filter((c) => c.kind === "expense") ?? [];
  const incomeCategories = categories?.filter((c) => c.kind === "income") ?? [];
  const transferCategories = categories?.filter((c) => c.kind === "transfer") ?? [];

  const renderCategory = (cat: (typeof expenseCategories)[0]) => {
    const isEditing = editingId === cat.id;

    return (
      <div
        key={cat.id}
        className={`flex items-center justify-between rounded-lg border border-border px-4 py-3 ${
          cat.archived ? "opacity-50" : ""
        }`}
      >
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 max-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleUpdate(cat.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setEditingId(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className="text-sm font-medium">{cat.name}</span>
        )}

        {!isEditing && (
          <div className="flex items-center gap-1">
            {cat.archived && (
              <Badge variant="outline" className="mr-2 text-[10px]">
                archived
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setEditingId(cat.id);
                setEditName(cat.name);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleToggleArchive(cat.id, cat.archived)}
            >
              {cat.archived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
            </Button>
            {cat.archived && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete "${cat.name}" permanently?`)) {
                    deleteMutation.mutate(cat.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (
    title: string,
    items: typeof expenseCategories,
    kind: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          {items.length}
        </Badge>
      </div>
      {items.length > 0 ? (
        <StaggerList className="space-y-1">
          {items.map((cat) => (
            <StaggerItem key={cat.id}>{renderCategory(cat)}</StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No {kind} categories yet
        </p>
      )}
    </div>
  );

  return (
    <PageTransition>
    <div className="mx-auto max-w-6xl space-y-6">
      <FadeIn>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage your spending and income categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>
      </FadeIn>

      {/* Create form */}
      <AnimatePresence>
      {creating && (
        <SlideIn direction="down">
        <div className="flex items-end gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Groceries"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div className="w-[140px] space-y-1">
            <label className="text-xs text-muted-foreground">Kind</label>
            <Select value={newKind} onValueChange={setNewKind}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Add"}
          </Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
        </SlideIn>
      )}
      </AnimatePresence>

      {/* Error display */}
      {(createMutation.error || updateMutation.error || deleteMutation.error) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {(createMutation.error || updateMutation.error || deleteMutation.error)?.message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <FadeIn delay={0.15}>
        <div className="space-y-8">
          {renderSection("Expenses", expenseCategories, "expense")}
          {renderSection("Income", incomeCategories, "income")}
          {transferCategories.length > 0 &&
            renderSection("Transfers", transferCategories, "transfer")}
        </div>
        </FadeIn>
      )}
    </div>
    </PageTransition>
  );
}
