import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import { plaidClient } from "@/lib/plaid/client";
import {
  mapPlaidCategory,
  getDefaultCategories,
} from "@/lib/plaid/plaid-category-map";

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

  // ── Category auto-mapping setup ────────────────────────────────────
  // Check if user has any categories; if not, seed defaults
  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id, name, kind")
    .eq("archived", false);

  let userCategories = existingCategories ?? [];

  if (userCategories.length === 0) {
    // Seed default categories for the user
    const defaults = getDefaultCategories();
    const rows = defaults.map((cat, i) => ({
      user_id: user.id,
      name: cat.name,
      kind: cat.kind,
      sort_order: i,
    }));

    const { data: seeded } = await supabase
      .from("categories")
      .insert(rows)
      .select("id, name, kind");

    userCategories = seeded ?? [];
  }

  // Build a lowercase name → id map for matching
  const categoryNameToId = new Map<string, string>();
  for (const cat of userCategories) {
    categoryNameToId.set(cat.name.toLowerCase(), cat.id);
  }

  // ── Sync loop ──────────────────────────────────────────────────────
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

        // Auto-categorize from Plaid's personal_finance_category
        const plaidPrimary = txn.personal_finance_category?.primary ?? null;
        const mapped = mapPlaidCategory(plaidPrimary);
        const categoryId = mapped
          ? categoryNameToId.get(mapped.name.toLowerCase()) ?? null
          : null;

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
            category_id: categoryId,
            plaid_category: plaidPrimary,
            location_lat: txn.location?.lat ?? null,
            location_lon: txn.location?.lon ?? null,
            location_address: txn.location?.address ?? null,
            location_city: txn.location?.city ?? null,
            location_region: txn.location?.region ?? null,
            location_postal_code: txn.location?.postal_code ?? null,
            location_country: txn.location?.country ?? null,
          });

        // Skip duplicates silently (unique constraint on plaid_transaction_id)
        if (!insertErr) added++;
      }

      // Process modified transactions
      for (const txn of syncData.modified) {
        const amount = -(txn.amount);
        const plaidPrimary = txn.personal_finance_category?.primary ?? null;

        // For modified transactions, only auto-categorize if currently uncategorized
        // (don't overwrite user corrections)
        const mapped = mapPlaidCategory(plaidPrimary);
        const autoCategory = mapped
          ? categoryNameToId.get(mapped.name.toLowerCase()) ?? null
          : null;

        // Fetch existing to check if user already categorized
        const { data: existing } = await supabase
          .from("transactions")
          .select("category_id")
          .eq("plaid_transaction_id", txn.transaction_id)
          .maybeSingle();

        const updatePayload: Record<string, unknown> = {
          amount,
          amount_base: amount,
          merchant: txn.merchant_name ?? txn.name,
          pending: txn.pending,
          txn_date: txn.date,
          plaid_category: plaidPrimary,
          location_lat: txn.location?.lat ?? null,
          location_lon: txn.location?.lon ?? null,
          location_address: txn.location?.address ?? null,
          location_city: txn.location?.city ?? null,
          location_region: txn.location?.region ?? null,
          location_postal_code: txn.location?.postal_code ?? null,
          location_country: txn.location?.country ?? null,
        };

        // Only set category if user hasn't manually categorized
        if (!existing?.category_id && autoCategory) {
          updatePayload.category_id = autoCategory;
        }

        await supabase
          .from("transactions")
          .update(updatePayload)
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
