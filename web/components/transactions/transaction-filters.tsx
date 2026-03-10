import type { AccountResponse, CategoryResponse } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TransactionFiltersProps {
  filters: {
    search: string;
    account_id: string;
    category_id: string;
    start_date: string;
    end_date: string;
  };
  accounts: AccountResponse[];
  categories: CategoryResponse[];
  onChange: (update: Partial<TransactionFiltersProps["filters"]>) => void;
}

export function TransactionFilters({
  filters,
  accounts,
  categories,
  onChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search merchant or note…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Account filter */}
      <Select
        value={filters.account_id || "all"}
        onValueChange={(v) =>
          onChange({ account_id: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select
        value={filters.category_id || "all"}
        onValueChange={(v) =>
          onChange({ category_id: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          <SelectItem value="uncategorized">Uncategorized</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <DateRangePicker
        className="min-w-[260px] flex-1"
        value={{
          startDate: filters.start_date,
          endDate: filters.end_date,
        }}
        onChange={({ startDate, endDate }) =>
          onChange({ start_date: startDate, end_date: endDate })
        }
        placeholder="Select range"
      />
    </div>
  );
}
