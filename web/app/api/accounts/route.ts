import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET() {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data, error: dbError } = await supabase
    .from("accounts")
    .select("*, plaid_items(institution_name, needs_reauth, last_synced_at)")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (dbError) return error("Failed to fetch accounts", 500);

  const accounts = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    source: row.source,
    currency: row.currency,
    current_balance: row.current_balance,
    balance_as_of: row.balance_as_of,
    plaid_item_id: row.plaid_item_id,
    institution_name: row.plaid_items?.institution_name ?? null,
    needs_reauth: row.plaid_items?.needs_reauth ?? null,
    last_synced_at: row.plaid_items?.last_synced_at ?? null,
    archived: row.archived,
    created_at: row.created_at,
  }));

  return json({ accounts });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { name, type, currency, current_balance } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return error("name is required", 400);
  }
  if (!type || typeof type !== "string") {
    return error("type is required", 400);
  }

  const { data, error: dbError } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: name.trim(),
      type,
      source: "manual",
      currency: currency || "USD",
      current_balance: current_balance ?? null,
      balance_as_of: current_balance != null ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (dbError) return error("Failed to create account", 500);

  return created(data);
}
