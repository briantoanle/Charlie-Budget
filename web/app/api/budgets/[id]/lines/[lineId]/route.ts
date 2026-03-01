import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, noContent } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id: budgetId, lineId } = await params;

  const body = await request.json();
  const { planned_amount } = body;

  if (planned_amount == null || typeof planned_amount !== "number") {
    return error("planned_amount is required and must be a number", 400);
  }

  const { data, error: dbError } = await supabase
    .from("budget_lines")
    .update({ planned_amount })
    .eq("id", lineId)
    .eq("budget_id", budgetId)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") return error("Budget line not found", 404);
    return error("Failed to update budget line", 500);
  }

  if (!data) return error("Budget line not found", 404);

  return json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id: budgetId, lineId } = await params;

  const { error: dbError } = await supabase
    .from("budget_lines")
    .delete()
    .eq("id", lineId)
    .eq("budget_id", budgetId);

  if (dbError) return error("Failed to delete budget line", 500);

  return noContent();
}
