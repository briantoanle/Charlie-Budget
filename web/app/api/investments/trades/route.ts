import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const accountId = request.nextUrl.searchParams.get("account_id");
  const ticker = request.nextUrl.searchParams.get("ticker");

  let query = supabase
    .from("investment_trades")
    .select("*");

  if (accountId) query = query.eq("account_id", accountId);
  if (ticker) query = query.eq("ticker", ticker);

  const { data, error: dbError } = await query.order("trade_date", {
    ascending: false,
  });

  if (dbError) return error("Failed to fetch trades", 500);

  return json({ trades: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { account_id, ticker, side, quantity, price, trade_date } = body;

  if (!account_id) return error("account_id is required", 400);
  if (!ticker || typeof ticker !== "string") return error("ticker is required", 400);
  if (!side || !["buy", "sell"].includes(side)) return error("side must be 'buy' or 'sell'", 400);
  if (!quantity || quantity <= 0) return error("quantity must be positive", 400);
  if (!price || price <= 0) return error("price must be positive", 400);
  if (!trade_date) return error("trade_date is required", 400);

  const total = quantity * price;

  // Record the trade
  const { data: trade, error: tradeError } = await supabase
    .from("investment_trades")
    .insert({
      user_id: user.id,
      account_id,
      ticker: ticker.toUpperCase(),
      side,
      quantity,
      price,
      total,
      trade_date,
    })
    .select()
    .single();

  if (tradeError) return error("Failed to record trade", 500);

  // Update or create the holding
  const { data: existing } = await supabase
    .from("investment_holdings")
    .select("*")
    .eq("account_id", account_id)
    .eq("ticker", ticker.toUpperCase())
    .single();

  if (existing) {
    if (side === "buy") {
      const newQuantity = existing.quantity + quantity;
      const newAvgCost =
        (existing.quantity * existing.avg_cost + quantity * price) / newQuantity;
      await supabase
        .from("investment_holdings")
        .update({ quantity: newQuantity, avg_cost: newAvgCost })
        .eq("id", existing.id);
    } else {
      // Sell — reduce quantity, keep avg_cost
      if (quantity > existing.quantity) {
        return error("Sell quantity exceeds current held quantity", 400);
      }
      const newQuantity = existing.quantity - quantity;
      if (newQuantity === 0) {
        await supabase
          .from("investment_holdings")
          .delete()
          .eq("id", existing.id);
      } else {
        await supabase
          .from("investment_holdings")
          .update({ quantity: newQuantity })
          .eq("id", existing.id);
      }
    }
  } else if (side === "buy") {
    await supabase.from("investment_holdings").insert({
      user_id: user.id,
      account_id,
      ticker: ticker.toUpperCase(),
      quantity,
      avg_cost: price,
    });
  } else {
    return error("Cannot sell a ticker you don't hold", 400);
  }

  return created({ trade });
}
