import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type FlowRow = {
  amount_base: number | null;
  merchant: string | null;
  category_id: string | null;
  categories?: {
    name?: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const startDate = parseDate(sp.get("start_date"));
  const endDate = parseDate(sp.get("end_date"));
  const accountId = sp.get("account_id");

  if (!startDate || !endDate) {
    return error("start_date and end_date are required", 400);
  }

  let query = supabase
    .from("transactions")
    .select("amount_base, merchant, category_id, categories(name)")
    .is("deleted_at", null)
    .eq("pending", false)
    .lt("amount_base", 0)
    .gte("txn_date", startDate)
    .lte("txn_date", endDate);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data: rows, error: dbError } = await query;

  if (dbError) {
    return error("Failed to fetch spending flow", 500);
  }

  const categoryTotals = new Map<string, { label: string; total: number; merchants: Map<string, number> }>();

  for (const row of (rows ?? []) as FlowRow[]) {
    const amount = Math.abs(Number(row.amount_base ?? 0));
    if (!amount) continue;

    const categoryKey = row.category_id ?? "uncategorized";
    const categoryLabel = row.categories?.name ?? "Uncategorized";
    const merchantLabel = row.merchant?.trim() || "Other merchants";
    const categoryBucket = categoryTotals.get(categoryKey) ?? {
      label: categoryLabel,
      total: 0,
      merchants: new Map<string, number>(),
    };

    categoryBucket.total += amount;
    categoryBucket.merchants.set(
      merchantLabel,
      (categoryBucket.merchants.get(merchantLabel) ?? 0) + amount
    );
    categoryTotals.set(categoryKey, categoryBucket);
  }

  const topCategories = Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const nodes = [{ name: "Total spend" }];
  const links: Array<{ source: number; target: number; value: number }> = [];

  topCategories.forEach((category) => {
    const categoryIndex = nodes.push({ name: category.label }) - 1;
    links.push({ source: 0, target: categoryIndex, value: category.total });

    Array.from(category.merchants.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([merchant, total]) => {
        const merchantIndex = nodes.push({ name: merchant }) - 1;
        links.push({ source: categoryIndex, target: merchantIndex, value: total });
      });
  });

  return json({ nodes, links });
}
