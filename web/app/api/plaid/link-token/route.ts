import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import { plaidClient } from "@/lib/plaid/client";
import { CountryCode, Products } from "plaid";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { mode = "create", plaid_item_id } = body;

  if (mode === "update" && !plaid_item_id) {
    return error("plaid_item_id is required when mode is update", 400);
  }

  try {
    const linkRequest: Parameters<typeof plaidClient.linkTokenCreate>[0] = {
      user: { client_user_id: user.id },
      client_name: "Charlie Budget",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    };

    if (mode === "update" && plaid_item_id) {
      const { data: item } = await supabase
        .from("plaid_items")
        .select("access_token_enc")
        .eq("id", plaid_item_id)
        .single();

      if (!item) return error("Plaid item not found", 404);

      linkRequest.access_token = item.access_token_enc;
    }

    const response = await plaidClient.linkTokenCreate(linkRequest);

    return json({ link_token: response.data.link_token });
  } catch (e) {
    console.error("Plaid linkTokenCreate error:", e);
    return error("Failed to create link token", 500);
  }
}
