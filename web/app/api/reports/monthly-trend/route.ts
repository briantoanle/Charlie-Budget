import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const rawMonths = Number(request.nextUrl.searchParams.get("months") ?? "12");
  const months = Number.isFinite(rawMonths)
    ? Math.min(24, Math.max(1, Math.floor(rawMonths)))
    : 12;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const { data: txns, error: dbError } = await supabase
    .from("transactions")
    .select("txn_date, amount_base")
    .is("deleted_at", null)
    .eq("pending", false)
    .gte("txn_date", startDate)
    .lte("txn_date", endDate);

  if (dbError) return error("Failed to fetch monthly trend", 500);

  const monthly = new Map<string, { income: number; spending: number }>();

  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    monthly.set(monthKey(d), { income: 0, spending: 0 });
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
