import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, noContent } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.archived !== undefined) updates.archived = body.archived;

  if (Object.keys(updates).length === 0) {
    return error("No fields to update", 400);
  }

  const { data, error: dbError } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("A category with that name already exists", 409);
    }
    if (dbError.code === "PGRST116") return error("Category not found", 404);
    return error("Failed to update category", 500);
  }

  if (!data) return error("Category not found", 404);

  return json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  // Check if any non-deleted transactions reference this category
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
    .is("deleted_at", null);

  if (count && count > 0) {
    return json(
      { error: "Category is in use", transaction_count: count },
      409
    );
  }

  const { error: dbError } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (dbError) return error("Failed to delete category", 500);

  return noContent();
}
