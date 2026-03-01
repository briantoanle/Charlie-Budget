import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { error, created } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { source_month, target_month } = body;

  if (!source_month || !/^\d{4}-\d{2}$/.test(source_month)) {
    return error("source_month is required (format: YYYY-MM)", 400);
  }
  if (!target_month || !/^\d{4}-\d{2}$/.test(target_month)) {
    return error("target_month is required (format: YYYY-MM)", 400);
  }

  // Fetch source budget with lines
  const { data: source } = await supabase
    .from("budgets")
    .select("*, budget_lines(category_id, planned_amount)")
    .eq("month", `${source_month}-01`)
    .single();

  if (!source) return error("No budget found for source month", 404);

  // Create target budget
  const { data: target, error: insertError } = await supabase
    .from("budgets")
    .insert({ user_id: user.id, month: `${target_month}-01` })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return error("A budget already exists for the target month", 409);
    }
    return error("Failed to create budget", 500);
  }

  // Copy lines
  const linesToCopy = (source.budget_lines ?? []).map((line) => ({
    budget_id: target.id,
    category_id: line.category_id,
    planned_amount: line.planned_amount,
  }));

  if (linesToCopy.length > 0) {
    await supabase.from("budget_lines").insert(linesToCopy);
  }

  // Fetch the full new budget with lines
  const { data: result } = await supabase
    .from("budgets")
    .select("*, budget_lines(*, categories(name))")
    .eq("id", target.id)
    .single();

  const lines = (result?.budget_lines ?? []).map((line) => ({
    id: line.id,
    category_id: line.category_id,
    category_name: line.categories?.name ?? null,
    planned_amount: Number(line.planned_amount),
    actual_amount: 0,
  }));

  return created({
    budget: {
      id: target.id,
      month: target.month,
      created_at: target.created_at,
      lines,
      totals: {
        planned: lines.reduce((sum, l) => sum + l.planned_amount, 0),
        actual: 0,
      },
    },
  });
}
