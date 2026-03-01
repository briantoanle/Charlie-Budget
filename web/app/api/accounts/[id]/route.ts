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
  if (body.archived !== undefined) updates.archived = body.archived;

  if (Object.keys(updates).length === 0) {
    return error("No fields to update", 400);
  }

  const { data, error: dbError } = await supabase
    .from("accounts")
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

  // Fetch the account to check source
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("*, plaid_items(access_token_enc)")
    .eq("id", id)
    .single();

  if (fetchError || !account) return error("Account not found", 404);

  // If Plaid-linked, revoke access token and clean up
  if (account.source === "plaid" && account.plaid_item_id) {
    try {
      const { plaidClient } = await import("@/lib/plaid/client");
      const accessToken = account.plaid_items?.access_token_enc;
      if (accessToken) {
        await plaidClient.itemRemove({ access_token: accessToken });
      }
    } catch {
      // Plaid revocation failure is non-fatal — continue with deletion
    }

    // Soft-delete all transactions for this account
    await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("account_id", id);

    // Delete the plaid_item
    await supabase
      .from("plaid_items")
      .delete()
      .eq("id", account.plaid_item_id);
  }

  // Delete the account (FK cascades transactions for manual accounts)
  const { error: deleteError } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (deleteError) return error("Failed to delete account", 500);

  return noContent();
}
