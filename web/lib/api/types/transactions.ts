export interface TransactionResponse {
  id: string;
  txn_date: string;
  amount: number;
  amount_base: number;
  currency: string;
  merchant: string | null;
  note: string | null;
  pending: boolean;
  source: string;
  category_id: string | null;
  category_name: string | null;
  account_id: string;
  account_name: string;
  excludeFromSpending: boolean;
}

export interface TransactionPagination {
  page: number;
  per_page: number;
  total: number;
}
