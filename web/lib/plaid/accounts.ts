import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountBase } from "plaid";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];

function normalizePlaidAccount(
  account: AccountBase,
  userId: string,
  plaidItemId: string,
): AccountInsert {
  return {
    user_id: userId,
    name: account.mask ? `${account.name} ••${account.mask}` : account.name,
    type: account.subtype ?? account.type,
    source: "plaid",
    plaid_account_id: account.account_id,
    persistent_account_id: account.persistent_account_id ?? null,
    plaid_item_id: plaidItemId,
    plaid_type: account.type,
    plaid_subtype: account.subtype ?? null,
    currency: (account.balances.iso_currency_code ?? "USD").toUpperCase(),
    current_balance: account.balances.current,
    balance_as_of: new Date().toISOString(),
    archived: false,
  };
}

async function upsertAccounts(
  supabase: AppSupabaseClient,
  rows: AccountInsert[],
  onConflict: "persistent_account_id" | "plaid_account_id",
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from("accounts")
    .upsert(rows, { onConflict })
    .select("*");

  if (error) {
    throw new Error(`Failed to upsert Plaid accounts (${onConflict}): ${error.message}`);
  }

  return data ?? [];
}

export async function upsertPlaidAccounts(params: {
  supabase: AppSupabaseClient;
  userId: string;
  plaidItemId: string;
  accounts: AccountBase[];
}) {
  const { supabase, userId, plaidItemId, accounts } = params;
  const normalized = accounts.map((account) =>
    normalizePlaidAccount(account, userId, plaidItemId),
  );

  const rowsWithPersistentId = normalized.filter(
    (row): row is AccountInsert & { persistent_account_id: string } =>
      typeof row.persistent_account_id === "string" && row.persistent_account_id.length > 0,
  );
  const rowsWithoutPersistentId = normalized.filter(
    (row) => !row.persistent_account_id && row.plaid_account_id,
  );

  await upsertAccounts(supabase, rowsWithPersistentId, "persistent_account_id");
  await upsertAccounts(supabase, rowsWithoutPersistentId, "plaid_account_id");

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("plaid_item_id", plaidItemId)
    .eq("source", "plaid")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to reload Plaid accounts: ${error.message}`);
  }

  return data ?? [];
}
