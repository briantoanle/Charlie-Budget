import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const per_page = Math.min(200, Math.max(1, Number(sp.get("per_page") ?? "50")));
  const account_id = sp.get("account_id");
  const category_id = sp.get("category_id");
  const start_date = sp.get("start_date");
  const end_date = sp.get("end_date");
  const search = sp.get("search");
  const pending = sp.get("pending");

  let query = supabase
    .from("transactions")
    .select("*, categories(name), accounts!inner(name)", { count: "exact" })
    .is("deleted_at", null)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (account_id) query = query.eq("account_id", account_id);
  if (category_id === "uncategorized") {
    query = query.is("category_id", null);
  } else if (category_id) {
    query = query.eq("category_id", category_id);
  }
  if (start_date) query = query.gte("txn_date", start_date);
  if (end_date) query = query.lte("txn_date", end_date);
  if (search) {
    query = query.or(`merchant.ilike.%${search}%,note.ilike.%${search}%`);
  }
  if (pending !== null && pending !== undefined) {
    query = query.eq("pending", pending === "true");
  }

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data: rows, count, error: dbError } = await query;

  if (dbError) return error("Failed to fetch transactions", 500);

  const data = (rows ?? []).map((row) => ({
    id: row.id,
    txn_date: row.txn_date,
    amount: row.amount,
    amount_base: row.amount_base,
    currency: row.currency,
    merchant: row.merchant,
    note: row.note,
    pending: row.pending,
    needs_review: row.needs_review,
    source: row.source,
    category_id: row.category_id,
    category_name: row.categories?.name ?? null,
    account_id: row.account_id,
    account_name: row.accounts?.name ?? null,
  }));

  return json({
    data,
    pagination: { page, per_page, total: count ?? 0 },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { account_id, txn_date, amount, category_id, merchant, note, currency } = body;

  if (!account_id) return error("account_id is required", 400);
  if (!txn_date) return error("txn_date is required", 400);
  if (amount == null || typeof amount !== "number") {
    return error("amount is required and must be a number", 400);
  }

  // Verify account exists and get its currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", account_id)
    .single();

  if (!account) return error("Account not found", 404);

  const txnCurrency = currency || account.currency;

  const { data, error: dbError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id,
      category_id: category_id ?? null,
      txn_date,
      amount,
      currency: txnCurrency,
      amount_base: amount,
      merchant: merchant ?? null,
      note: note ?? null,
      source: "manual",
    })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23503") return error("Invalid account_id or category_id", 400);
    return error("Failed to create transaction", 500);
  }

  return created(data);
}
