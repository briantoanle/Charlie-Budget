export interface BudgetLineResponse {
  id: string;
  category_id: string;
  category_name: string;
  planned_amount: number;
  actual_amount: number;
}

export interface BudgetResponse {
  id: string;
  month: string;
  created_at: string;
  lines: BudgetLineResponse[];
  totals: {
    planned: number;
    actual: number;
  };
}
