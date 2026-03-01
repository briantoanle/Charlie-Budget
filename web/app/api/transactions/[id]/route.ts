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

  if (body.category_id !== undefined) updates.category_id = body.category_id;
  if (body.note !== undefined) updates.note = body.note;
  if (body.merchant !== undefined) updates.merchant = body.merchant;
  if (body.needs_review !== undefined) updates.needs_review = body.needs_review;

  if (Object.keys(updates).length === 0) {
    return error("No fields to update", 400);
  }

  const { data, error: dbError } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") return error("Transaction not found", 404);
    return error("Failed to update transaction", 500);
  }

  if (!data) return error("Transaction not found", 404);

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

  const { data, error: dbError } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (dbError || !data) return error("Transaction not found", 404);

  return noContent();
}
