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

  if (body.name !== undefined) updates.name = body.name;
  if (body.broker !== undefined) updates.broker = body.broker;

  if (Object.keys(updates).length === 0) {
    return error("No fields to update", 400);
  }

  const { data, error: dbError } = await supabase
    .from("investment_accounts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") return error("Account not found", 404);
    return error("Failed to update account", 500);
  }

  if (!data) return error("Account not found", 404);

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

  const { error: deleteError } = await supabase
    .from("investment_accounts")
    .delete()
    .eq("id", id);

  if (deleteError) return error("Failed to delete account", 500);

  return noContent();
}
