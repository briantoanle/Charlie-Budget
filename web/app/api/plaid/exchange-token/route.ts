import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import { plaidClient } from "@/lib/plaid/client";
import { upsertPlaidAccounts } from "@/lib/plaid/accounts";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { public_token, institution_id, institution_name } = body;

  if (!public_token) return error("public_token is required", 400);
  if (!institution_id) return error("institution_id is required", 400);
  if (!institution_name) return error("institution_name is required", 400);

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const { access_token, item_id } = exchangeResponse.data;

    // Store or refresh the Plaid item so relinks don't fail on item_id uniqueness.
    const { data: plaidItem, error: insertError } = await supabase
      .from("plaid_items")
      .upsert({
        user_id: user.id,
        institution_id,
        institution_name,
        access_token_enc: access_token,
        item_id,
        needs_reauth: false,
      }, {
        onConflict: "item_id",
      })
      .select()
      .single();

    if (insertError) return error("Failed to store Plaid item", 500);

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const insertedAccounts = await upsertPlaidAccounts({
      supabase,
      userId: user.id,
      plaidItemId: plaidItem.id,
      accounts: accountsResponse.data.accounts,
    });

    // Kick off initial sync
    try {
      await fetch(new URL("/api/plaid/sync", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
        body: JSON.stringify({ plaid_item_id: plaidItem.id }),
      });
    } catch {
      // Non-fatal — sync can be triggered manually
    }

    return json({
      plaid_item_id: plaidItem.id,
      accounts: insertedAccounts ?? [],
    });
  } catch (e) {
    console.error("Plaid exchange-token error:", e);
    return error("Failed to exchange token", 500);
  }
}
