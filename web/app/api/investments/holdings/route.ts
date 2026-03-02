import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const accountId = request.nextUrl.searchParams.get("account_id");

  let query = supabase
    .from("investment_holdings")
    .select("*");

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error: dbError } = await query.order("ticker");

  if (dbError) return error("Failed to fetch holdings", 500);

  // Calculate market value and P&L for each holding
  const holdings = (data ?? []).map((h) => {
    const currentPrice = h.current_price ?? h.avg_cost;
    const marketValue = h.quantity * currentPrice;
    const costBasis = h.quantity * h.avg_cost;
    const unrealizedPnl = marketValue - costBasis;
    const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    return {
      ...h,
      current_price: currentPrice,
      market_value: marketValue,
      unrealized_pnl: unrealizedPnl,
      unrealized_pnl_pct: unrealizedPnlPct,
    };
  });

  return json({ holdings });
}
