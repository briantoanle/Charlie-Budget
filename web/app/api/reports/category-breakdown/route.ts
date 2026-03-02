import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const start_date = sp.get("start_date");
  const end_date = sp.get("end_date");
  const kind = sp.get("kind") ?? "expense";

  if (!start_date) return error("start_date is required", 400);
  if (!end_date) return error("end_date is required", 400);
  if (kind !== "expense" && kind !== "income") {
    return error("kind must be expense or income", 400);
  }

  const { data: txns, error: dbError } = await supabase
    .from("transactions")
    .select("amount_base, category_id, categories(name, kind)")
    .is("deleted_at", null)
    .eq("pending", false)
    .gte("txn_date", start_date)
    .lte("txn_date", end_date);

  if (dbError) return error("Failed to fetch category breakdown", 500);

  const totals = new Map<string, { category_id: string | null; category_name: string; total: number }>();

  for (const txn of txns ?? []) {
    const amount = Number(txn.amount_base ?? 0);
    if (kind === "expense" && amount >= 0) continue;
    if (kind === "income" && amount <= 0) continue;

    const isUncategorized = !txn.category_id;
    const categoryKind = txn.categories?.kind;
    if (!isUncategorized && categoryKind !== kind) continue;

    const id = txn.category_id ?? null;
    const name = txn.categories?.name ?? "Uncategorized";
    const key = id ?? "uncategorized";
    const normalized = Math.abs(amount);

    const existing = totals.get(key);
    if (existing) {
      existing.total += normalized;
    } else {
      totals.set(key, { category_id: id, category_name: name, total: normalized });
    }
  }

  const rows = Array.from(totals.values()).sort((a, b) => b.total - a.total);
  const grand_total = rows.reduce((sum, row) => sum + row.total, 0);

  if (grand_total === 0) {
    return json({ data: [], grand_total: 0 });
  }

  const data = rows.map((row) => ({
    ...row,
    percentage: (row.total / grand_total) * 100,
  }));

  return json({ data, grand_total });
}
