"use client";

export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useAccounts, useCategories, useSpendingMap } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SpendingMapCanvas = nextDynamic(
  () => import("@/components/spending/spending-map-canvas").then((mod) => mod.SpendingMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[340px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-muted-foreground">
        Loading map...
      </div>
    ),
  }
);

export default function SpendingMapPage() {
  const [filters, setFilters] = useState({
    search: "",
    account_id: "",
    category_id: "",
    start_date: "",
    end_date: "",
  });

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data, isLoading, error } = useSpendingMap(filters);
  const hasActiveFilters =
    !!filters.search ||
    !!filters.account_id ||
    !!filters.category_id ||
    !!filters.start_date ||
    !!filters.end_date;
  const hasIncompleteDateRange = Boolean(filters.start_date) !== Boolean(filters.end_date);

  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Spending Map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize where your card spending happened from Plaid location data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Merchant</label>
          <Search className="absolute top-[calc(50%+10px)] left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search merchant..."
            className="pl-9"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Account</label>
          <Select
            value={filters.account_id || "all"}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, account_id: v === "all" ? "" : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Category</label>
          <Select
            value={filters.category_id || "all"}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, category_id: v === "all" ? "" : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasIncompleteDateRange
            ? "Add both a start and end date to apply a full date range."
            : "Tip: combine merchant and date filters to find patterns faster."}
        </p>
        <button
          type="button"
          className="text-xs font-medium text-primary disabled:text-muted-foreground"
          disabled={!hasActiveFilters}
          onClick={() =>
            setFilters({
              search: "",
              account_id: "",
              category_id: "",
              start_date: "",
              end_date: "",
            })
          }
        >
          Clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Mapped transactions</p>
          <p className="mt-1 text-xl font-semibold">{data?.summary.transactions_mapped ?? 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Unique hotspots</p>
          <p className="mt-1 text-xl font-semibold">{data?.summary.hotspots_count ?? 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-medium text-muted-foreground">Total mapped spend</p>
          <p className="mt-1 text-xl font-semibold">
            ${(data?.summary.total_spend ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-foreground">Unable to load map data</p>
          <p className="text-xs text-muted-foreground">
            We could not fetch location data right now. Try again in a few moments.
          </p>
        </div>
      )}

      <div className="glass-card flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
            Loading map...
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
            Map preview is temporarily unavailable.
          </div>
        ) : (data?.hotspots.length ?? 0) === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-muted-foreground">
            No mappable spend found for the selected filters.
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4">
            <SpendingMapCanvas hotspots={data?.hotspots ?? []} />
            <p className="text-xs text-muted-foreground">
              Bubble size scales with total spend at that location. Some transactions have no merchant location and do
              not appear on the map.
            </p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Top spending hotspots</h2>
        </div>
        <div className="divide-y divide-border/50">
          {(data?.hotspots ?? []).slice(0, 12).map((spot) => (
            <div key={`list-${spot.key}`} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{spot.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {spot.transactions_count} transactions • {spot.merchants.slice(0, 3).join(", ") || "Unknown merchant"}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">
                ${spot.total_spend.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
          {!isLoading && (data?.hotspots.length ?? 0) === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No mappable spend found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
