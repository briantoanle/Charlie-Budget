import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { error, created } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id: budgetId } = await params;

  const body = await request.json();
  const { category_id, planned_amount } = body;

  if (!category_id) return error("category_id is required", 400);
  if (planned_amount == null || typeof planned_amount !== "number") {
    return error("planned_amount is required and must be a number", 400);
  }

  // Verify budget exists (RLS checks ownership)
  const { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", budgetId)
    .single();

  if (!budget) return error("Budget not found", 404);

  const { data, error: dbError } = await supabase
    .from("budget_lines")
    .insert({ budget_id: budgetId, category_id, planned_amount })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("This category already has a line in this budget", 409);
    }
    if (dbError.code === "23503") {
      return error("Invalid category_id", 400);
    }
    return error("Failed to add budget line", 500);
  }

  return created(data);
}
