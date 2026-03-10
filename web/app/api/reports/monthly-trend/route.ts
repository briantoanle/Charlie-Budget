import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const rawMonths = Number(request.nextUrl.searchParams.get("months") ?? "12");
  const months = Number.isFinite(rawMonths)
    ? Math.min(24, Math.max(1, Math.floor(rawMonths)))
    : 12;
  const startParam = parseDate(request.nextUrl.searchParams.get("start_date"));
  const endParam = parseDate(request.nextUrl.searchParams.get("end_date"));
  const accountId = request.nextUrl.searchParams.get("account_id");

  let start = startParam ? new Date(startParam.getFullYear(), startParam.getMonth(), 1) : null;
  let end = endParam;

  if (!start || !end) {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    end = now;
  }

  if (start.getTime() > end.getTime()) {
    return error("start_date must be before or equal to end_date", 400);
  }

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  let query = supabase
    .from("transactions")
    .select("txn_date, amount_base")
    .is("deleted_at", null)
    .eq("pending", false)
    .gte("txn_date", startDate)
    .lte("txn_date", endDate);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data: txns, error: dbError } = await query;

  if (dbError) return error("Failed to fetch monthly trend", 500);

  const monthly = new Map<string, { income: number; spending: number }>();

  for (
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    cursor.getTime() <= end.getTime();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  ) {
    monthly.set(monthKey(cursor), { income: 0, spending: 0 });
  }

  for (const txn of txns ?? []) {
    const key = String(txn.txn_date).slice(0, 7);
    const bucket = monthly.get(key);
    if (!bucket) continue;

    const amount = Number(txn.amount_base ?? 0);
    if (amount > 0) {
      bucket.income += amount;
    } else if (amount < 0) {
      bucket.spending += Math.abs(amount);
    }
  }

  const data = Array.from(monthly.entries()).map(([month, sums]) => ({
    month,
    income: sums.income,
    spending: sums.spending,
    net: sums.income - sums.spending,
  }));

  return json({ data });
}
