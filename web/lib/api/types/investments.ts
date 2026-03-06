export interface InvestmentAccountResponse {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
  created_at: string;
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  account_id: string;
}

export interface TradeResponse {
  id: string;
  ticker: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  trade_date: string;
  account_id: string;
  created_at: string;
}

export interface DividendResponse {
  id: string;
  ticker: string;
  amount: number;
  per_share: number | null;
  ex_date: string | null;
  pay_date: string | null;
  account_id: string;
  created_at: string;
}
