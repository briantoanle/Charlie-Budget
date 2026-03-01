import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import { plaidClient } from "@/lib/plaid/client";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { plaid_item_id } = body;

  if (!plaid_item_id) return error("plaid_item_id is required", 400);

  // Fetch plaid item (RLS checks ownership)
  const { data: plaidItem } = await supabase
    .from("plaid_items")
    .select("*")
    .eq("id", plaid_item_id)
    .single();

  if (!plaidItem) return error("Plaid item not found", 404);

  // Build a map of plaid_account_id → account.id for fast lookup
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, plaid_account_id")
    .eq("plaid_item_id", plaid_item_id);

  const accountMap = new Map<string, string>();
  for (const acct of accounts ?? []) {
    if (acct.plaid_account_id) {
      accountMap.set(acct.plaid_account_id, acct.id);
    }
  }

  let cursor = plaidItem.cursor ?? undefined;
  let added = 0;
  let modified = 0;
  let removed = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: plaidItem.access_token_enc,
        cursor,
      });

      const syncData = response.data;

      // Process added transactions
      for (const txn of syncData.added) {
        const accountId = accountMap.get(txn.account_id);
        if (!accountId) continue;

        // Plaid: positive = debit (expense), negative = credit (income)
        // Our schema: negative = expense, positive = income → negate
        const amount = -(txn.amount);

        const { error: insertErr } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            account_id: accountId,
            txn_date: txn.date,
            amount,
            currency: (txn.iso_currency_code ?? "USD").toUpperCase(),
            amount_base: amount,
            merchant: txn.merchant_name ?? txn.name,
            source: "plaid",
            plaid_transaction_id: txn.transaction_id,
            pending: txn.pending,
          });

        // Skip duplicates silently (unique constraint on plaid_transaction_id)
        if (!insertErr) added++;
      }

      // Process modified transactions
      for (const txn of syncData.modified) {
        const amount = -(txn.amount);

        await supabase
          .from("transactions")
          .update({
            amount,
            amount_base: amount,
            merchant: txn.merchant_name ?? txn.name,
            pending: txn.pending,
            txn_date: txn.date,
          })
          .eq("plaid_transaction_id", txn.transaction_id);

        modified++;
      }

      // Process removed transactions (soft delete)
      for (const txn of syncData.removed) {
        await supabase
          .from("transactions")
          .update({ deleted_at: new Date().toISOString() })
          .eq("plaid_transaction_id", txn.transaction_id);

        removed++;
      }

      cursor = syncData.next_cursor;
      hasMore = syncData.has_more;
    }

    // Update cursor and last_synced_at
    await supabase
      .from("plaid_items")
      .update({
        cursor: cursor ?? null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", plaid_item_id);

    return json({ added, modified, removed, cursor: cursor ?? null });
  } catch (e) {
    console.error("Plaid sync error:", e);
    return error("Failed to sync transactions", 500);
  }
}
