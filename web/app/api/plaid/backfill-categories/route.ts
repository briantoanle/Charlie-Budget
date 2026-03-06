import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import {
  getDefaultCategories,
  mapPlaidCategory,
} from "@/lib/plaid/plaid-category-map";

type BackfillBody = {
  plaid_item_id?: string;
  dry_run?: boolean;
};

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = (await request.json().catch(() => ({}))) as BackfillBody;
  const plaidItemId = body.plaid_item_id?.trim() || null;
  const dryRun = body.dry_run === true;

  // Ensure user has categories available for mapping targets.
  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id, name, kind")
    .eq("archived", false);

  let userCategories = existingCategories ?? [];

  if (userCategories.length === 0) {
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

  const categoryNameToId = new Map<string, string>();
  for (const cat of userCategories) {
    categoryNameToId.set(cat.name.toLowerCase(), cat.id);
  }

  let accountIds: string[] | null = null;
  if (plaidItemId) {
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id")
      .eq("plaid_item_id", plaidItemId);

    if (accountsError) return error("Failed to load accounts for plaid item", 500);

    accountIds = (accounts ?? []).map((a) => a.id);
    if (accountIds.length === 0) {
      return json({
        updated: 0,
        scanned: 0,
        mapped: 0,
        skipped_unmapped: 0,
        skipped_no_category_target: 0,
        dry_run: dryRun,
      });
    }
  }

  const pageSize = 1000;
  let from = 0;
  const candidates: Array<{ id: string; plaid_category: string }> = [];

  while (true) {
    let query = supabase
      .from("transactions")
      .select("id, plaid_category")
      .eq("source", "plaid")
      .is("category_id", null)
      .is("deleted_at", null)
      .not("plaid_category", "is", null)
      .range(from, from + pageSize - 1);

    if (accountIds) {
      query = query.in("account_id", accountIds);
    }

    const { data: rows, error: rowsError } = await query;
    if (rowsError) return error("Failed to load uncategorized Plaid transactions", 500);

    const batch = rows ?? [];
    for (const row of batch) {
      if (row.plaid_category) {
        candidates.push({ id: row.id, plaid_category: row.plaid_category });
      }
    }

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  let mapped = 0;
  let skippedUnmapped = 0;
  let skippedNoCategoryTarget = 0;
  const updateGroups = new Map<string, string[]>();

  for (const txn of candidates) {
    const mappedCategory = mapPlaidCategory(txn.plaid_category);
    if (!mappedCategory) {
      skippedUnmapped++;
      continue;
    }

    const categoryId = categoryNameToId.get(mappedCategory.name.toLowerCase()) ?? null;
    if (!categoryId) {
      skippedNoCategoryTarget++;
      continue;
    }

    mapped++;
    const ids = updateGroups.get(categoryId) ?? [];
    ids.push(txn.id);
    updateGroups.set(categoryId, ids);
  }

  let updated = 0;
  if (!dryRun) {
    for (const [categoryId, ids] of updateGroups.entries()) {
      if (ids.length === 0) continue;
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ category_id: categoryId })
        .in("id", ids)
        .eq("source", "plaid")
        .is("category_id", null)
        .is("deleted_at", null);

      if (updateError) return error("Failed while updating categories", 500);
      updated += ids.length;
    }
  }

  return json({
    updated,
    scanned: candidates.length,
    mapped,
    skipped_unmapped: skippedUnmapped,
    skipped_no_category_target: skippedNoCategoryTarget,
    dry_run: dryRun,
  });
}
