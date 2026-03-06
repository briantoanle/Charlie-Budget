import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { error, noContent } from "@/lib/api/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  // actions: 'archive' or 'delete'
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  if (action !== "archive" && action !== "delete") {
    return error("Invalid action. Must be 'archive' or 'delete'", 400);
  }

  // Fetch the plaid item to ensure it exists and belongs to the user
  const { data: item, error: fetchError } = await supabase
    .from("plaid_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !item) return error("Plaid item not found", 404);

  // Revoke token from Plaid (best effort, do not fail completely if it errors)
  try {
    const { plaidClient } = await import("@/lib/plaid/client");
    if (item.access_token_enc) {
      await plaidClient.itemRemove({ access_token: item.access_token_enc });
    }
  } catch (err) {
    console.error("Failed to revoke Plaid item:", err);
  }

  if (action === "archive") {
    // 1. Convert associated accounts to manual, archive them, unlink Plaid
    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        source: "manual",
        archived: true,
        plaid_account_id: null,
        plaid_item_id: null,
      })
      .eq("plaid_item_id", id);

    if (updateError) return error("Failed to archive accounts", 500);

    // 2. Delete the plaid item mapping
    const { error: deleteError } = await supabase
      .from("plaid_items")
      .delete()
      .eq("id", id);

    if (deleteError) return error("Failed to delete plaid item", 500);
  } else if (action === "delete") {
    // 1. Delete associated accounts (Cascade should handle transactions)
    const { error: accError } = await supabase
      .from("accounts")
      .delete()
      .eq("plaid_item_id", id);

    if (accError) return error("Failed to delete accounts", 500);

    // 2. Delete the plaid item mapping
    const { error: deleteError } = await supabase
      .from("plaid_items")
      .delete()
      .eq("id", id);

    if (deleteError) return error("Failed to delete plaid item", 500);
  }

  return noContent();
}
