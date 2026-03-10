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

export interface ReportSummaryMetricDelta {
  value: number;
  percentage: number | null;
}

export interface ReportSummaryCategory {
  category_id: string | null;
  category_name: string;
  total: number;
  percentage: number;
}

export interface ReportSummary {
  period: {
    start_date: string;
    end_date: string;
    comparison_start_date: string;
    comparison_end_date: string;
    month_count: number;
  };
  income: number;
  spending: number;
  net: number;
  savings_rate: number;
  average_monthly_spend: number;
  transactions_count: number;
  uncategorized_count: number;
  top_category: ReportSummaryCategory | null;
  comparison: {
    income: ReportSummaryMetricDelta;
    spending: ReportSummaryMetricDelta;
    net: ReportSummaryMetricDelta;
    savings_rate: ReportSummaryMetricDelta;
    average_monthly_spend: ReportSummaryMetricDelta;
  };
}

export interface ReportFlowNode {
  name: string;
}

export interface ReportFlowLink {
  source: number;
  target: number;
  value: number;
}

export interface ReportSpendingFlow {
  nodes: ReportFlowNode[];
  links: ReportFlowLink[];
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
