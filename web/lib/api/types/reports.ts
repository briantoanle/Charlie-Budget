export interface MonthlyTrendPoint {
  month: string;
  income: number;
  spending: number;
  net: number;
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total: number;
  percentage: number;
}

export interface SpendHotspot {
  key: string;
  lat: number;
  lon: number;
  label: string;
  total_spend: number;
  transactions_count: number;
  merchants: string[];
  last_txn_date: string;
}

export interface SpendMapResponse {
  hotspots: SpendHotspot[];
  summary: {
    hotspots_count: number;
    transactions_mapped: number;
    total_spend: number;
  };
}
