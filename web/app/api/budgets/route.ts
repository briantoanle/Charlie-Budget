import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

function lastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return error("month is required (format: YYYY-MM)", 400);
  }

  const monthDate = `${month}-01`;

  // Fetch budget + lines with category names
  const { data: budget, error: dbError } = await supabase
    .from("budgets")
    .select("*, budget_lines(*, categories(name))")
    .eq("month", monthDate)
    .maybeSingle();

  if (dbError) return error("Failed to fetch budget", 500);

  if (!budget) return json({ budget: null });

  // Calculate actuals: sum transactions per category in this month
  const startDate = monthDate;
  const endDate = lastDayOfMonth(month);

  const { data: txns } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .gte("txn_date", startDate)
    .lte("txn_date", endDate)
    .is("deleted_at", null);

  const actualsByCategory = new Map<string, number>();
  for (const txn of txns ?? []) {
    if (!txn.category_id) continue;
    const current = actualsByCategory.get(txn.category_id) ?? 0;
    actualsByCategory.set(txn.category_id, current + Number(txn.amount));
  }

  const lines = (budget.budget_lines ?? []).map((line) => ({
    id: line.id,
    category_id: line.category_id,
    category_name: line.categories?.name ?? null,
    planned_amount: Number(line.planned_amount),
    actual_amount: Math.abs(actualsByCategory.get(line.category_id) ?? 0),
  }));

  const totals = {
    planned: lines.reduce((sum, l) => sum + l.planned_amount, 0),
    actual: lines.reduce((sum, l) => sum + l.actual_amount, 0),
  };

  return json({
    budget: {
      id: budget.id,
      month: budget.month,
      created_at: budget.created_at,
      lines,
      totals,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { month } = body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return error("month is required (format: YYYY-MM)", 400);
  }

  const { data, error: dbError } = await supabase
    .from("budgets")
    .insert({ user_id: user.id, month: `${month}-01` })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("A budget already exists for this month", 409);
    }
    return error("Failed to create budget", 500);
  }

  return created({
    budget: { ...data, lines: [], totals: { planned: 0, actual: 0 } },
  });
}
