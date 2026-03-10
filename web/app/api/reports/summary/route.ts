import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function daysBetween(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
}

function monthSpan(start: Date, end: Date) {
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1
  );
}

type SummaryRow = {
  amount_base: number | null;
  category_id: string | null;
  categories?: {
    name?: string | null;
    kind?: string | null;
  } | null;
};

function summarize(rows: SummaryRow[], start: Date, end: Date) {
  let income = 0;
  let spending = 0;
  let transactionsCount = 0;
  let uncategorizedCount = 0;
  const categoryTotals = new Map<string, { category_id: string | null; category_name: string; total: number }>();

  for (const row of rows) {
    const amount = Number(row.amount_base ?? 0);
    if (amount === 0) continue;

    transactionsCount += 1;
    if (!row.category_id) {
      uncategorizedCount += 1;
    }

    if (amount > 0) {
      income += amount;
      continue;
    }

    const normalized = Math.abs(amount);
    spending += normalized;

    const categoryName = row.categories?.name ?? "Uncategorized";
    const key = row.category_id ?? "uncategorized";
    const existing = categoryTotals.get(key);
    if (existing) {
      existing.total += normalized;
    } else {
      categoryTotals.set(key, {
        category_id: row.category_id ?? null,
        category_name: categoryName,
        total: normalized,
      });
    }
  }

  const net = income - spending;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  const averageMonthlySpend = spending / monthSpan(start, end);
  const topCategoryRow = Array.from(categoryTotals.values()).sort((a, b) => b.total - a.total)[0] ?? null;

  return {
    income,
    spending,
    net,
    savings_rate: savingsRate,
    average_monthly_spend: averageMonthlySpend,
    transactions_count: transactionsCount,
    uncategorized_count: uncategorizedCount,
    top_category: topCategoryRow
      ? {
          ...topCategoryRow,
          percentage: spending > 0 ? (topCategoryRow.total / spending) * 100 : 0,
        }
      : null,
  };
}

function buildDelta(current: number, previous: number) {
  const value = current - previous;
  const percentage = previous === 0 ? null : (value / previous) * 100;
  return { value, percentage };
}

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const start = parseDate(sp.get("start_date"));
  const end = parseDate(sp.get("end_date"));
  const accountId = sp.get("account_id");

  if (!start || !end) {
    return error("start_date and end_date are required", 400);
  }

  if (start.getTime() > end.getTime()) {
    return error("start_date must be before or equal to end_date", 400);
  }

  const periodDays = daysBetween(start, end);
  const comparisonEnd = new Date(start);
  comparisonEnd.setDate(comparisonEnd.getDate() - 1);
  const comparisonStart = new Date(comparisonEnd);
  comparisonStart.setDate(comparisonStart.getDate() - (periodDays - 1));

  const selectClause = "amount_base, category_id, categories(name, kind)";

  let currentQuery = supabase
    .from("transactions")
    .select(selectClause)
    .is("deleted_at", null)
    .eq("pending", false)
    .gte("txn_date", formatDate(start))
    .lte("txn_date", formatDate(end));

  let previousQuery = supabase
    .from("transactions")
    .select(selectClause)
    .is("deleted_at", null)
    .eq("pending", false)
    .gte("txn_date", formatDate(comparisonStart))
    .lte("txn_date", formatDate(comparisonEnd));

  if (accountId) {
    currentQuery = currentQuery.eq("account_id", accountId);
    previousQuery = previousQuery.eq("account_id", accountId);
  }

  const [{ data: currentRows, error: currentError }, { data: previousRows, error: previousError }] =
    await Promise.all([currentQuery, previousQuery]);

  if (currentError || previousError) {
    return error("Failed to fetch report summary", 500);
  }

  const current = summarize((currentRows ?? []) as SummaryRow[], start, end);
  const previous = summarize((previousRows ?? []) as SummaryRow[], comparisonStart, comparisonEnd);

  return json({
    period: {
      start_date: formatDate(start),
      end_date: formatDate(end),
      comparison_start_date: formatDate(comparisonStart),
      comparison_end_date: formatDate(comparisonEnd),
      month_count: monthSpan(start, end),
    },
    ...current,
    comparison: {
      income: buildDelta(current.income, previous.income),
      spending: buildDelta(current.spending, previous.spending),
      net: buildDelta(current.net, previous.net),
      savings_rate: buildDelta(current.savings_rate, previous.savings_rate),
      average_monthly_spend: buildDelta(
        current.average_monthly_spend,
        previous.average_monthly_spend
      ),
    },
  });
}
