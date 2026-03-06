export interface AccountResponse {
  id: string;
  name: string;
  type: string;
  source: string;
  currency: string;
  current_balance: number | null;
  balance_as_of: string | null;
  plaid_item_id: string | null;
  institution_name: string | null;
  needs_reauth: boolean;
  last_synced_at: string | null;
  archived: boolean;
  created_at: string;
}
