"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
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

const MAP_WIDTH = 960;
const MAP_HEIGHT = 460;

function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

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

  const markerScale = useMemo(() => {
    const maxSpend = Math.max(...(data?.hotspots.map((h) => h.total_spend) ?? [1]));
    return (amount: number) => 4 + (amount / maxSpend) * 16;
  }, [data]);
  const hasActiveFilters =
    !!filters.search ||
    !!filters.account_id ||
    !!filters.category_id ||
    !!filters.start_date ||
    !!filters.end_date;
  const hasIncompleteDateRange = Boolean(filters.start_date) !== Boolean(filters.end_date);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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

      <div className="glass-card overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading map...</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Map preview is temporarily unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                className="h-[460px] min-w-[840px] w-full rounded-xl border border-border/60 bg-gradient-to-b from-sky-50 to-blue-100"
                role="img"
                aria-label="Spending hotspots world map"
              >
                {Array.from({ length: 11 }).map((_, i) => {
                  const y = (i / 10) * MAP_HEIGHT;
                  return <line key={`lat-${i}`} x1={0} y1={y} x2={MAP_WIDTH} y2={y} stroke="#9CA3AF" opacity="0.18" />;
                })}
                {Array.from({ length: 13 }).map((_, i) => {
                  const x = (i / 12) * MAP_WIDTH;
                  return <line key={`lon-${i}`} x1={x} y1={0} x2={x} y2={MAP_HEIGHT} stroke="#9CA3AF" opacity="0.18" />;
                })}

                {data?.hotspots.map((spot) => {
                  const { x, y } = project(spot.lon, spot.lat);
                  const radius = markerScale(spot.total_spend);
                  return (
                    <g key={spot.key}>
                      <circle cx={x} cy={y} r={radius} fill="#ef4444" opacity="0.22" />
                      <circle cx={x} cy={y} r={Math.max(3, radius * 0.35)} fill="#dc2626">
                        <title>
                          {spot.label} | ${spot.total_spend.toFixed(2)} | {spot.transactions_count} txns
                        </title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              Pin size scales with total spend at that coordinate. Some transactions have no merchant location and do
              not appear here.
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
