import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const accountId = request.nextUrl.searchParams.get("account_id");

  let query = supabase
    .from("investment_dividends")
    .select("*");

  if (accountId) query = query.eq("account_id", accountId);

  const { data, error: dbError } = await query.order("pay_date", {
    ascending: false,
  });

  if (dbError) return error("Failed to fetch dividends", 500);

  return json({ dividends: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { account_id, ticker, amount, per_share, ex_date, pay_date } = body;

  if (!account_id) return error("account_id is required", 400);
  if (!ticker) return error("ticker is required", 400);
  if (!amount || amount <= 0) return error("amount must be positive", 400);

  const { data, error: dbError } = await supabase
    .from("investment_dividends")
    .insert({
      user_id: user.id,
      account_id,
      ticker: ticker.toUpperCase(),
      amount,
      per_share: per_share || null,
      ex_date: ex_date || null,
      pay_date: pay_date || null,
    })
    .select()
    .single();

  if (dbError) return error("Failed to record dividend", 500);

  return created(data);
}
