import { BaseService } from "./BaseService";
import type { AccountResponse } from "@/lib/api/types";

interface PlaidItemJoin {
  institution_name: string | null;
  needs_reauth: boolean;
  last_synced_at: string | null;
}

interface AccountRow {
  id: string;
  name: string;
  type: string;
  source: string;
  currency: string;
  current_balance: number | null;
  balance_as_of: string | null;
  plaid_item_id: string | null;
  archived: boolean;
  created_at: string;
  plaid_items: PlaidItemJoin | PlaidItemJoin[] | null;
}

export class AccountService extends BaseService {
  async getAccounts(): Promise<AccountResponse[]> {
    const { data, error } = await this.supabase
      .from("accounts")
      .select("*, plaid_items:plaid_items(institution_name, needs_reauth, last_synced_at)")
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`Failed to fetch accounts: ${error.message} (${error.code})`);
      return [];
    }

    const accounts = (data ?? []).map((row: AccountRow) => {
      // Supabase might return single object or array depending on relationship constraint
      const plaidData = Array.isArray(row.plaid_items) ? row.plaid_items[0] : row.plaid_items;
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        source: row.source,
        currency: row.currency,
        current_balance: row.current_balance,
        balance_as_of: row.balance_as_of,
        plaid_item_id: row.plaid_item_id,
        institution_name: plaidData?.institution_name ?? null,
        needs_reauth: plaidData?.needs_reauth ?? false,
        last_synced_at: plaidData?.last_synced_at ?? null,
        archived: row.archived,
        created_at: row.created_at,
      };
    });

    return accounts;
  }

  async createAccount(name: string, type: string, currency: string = "USD", current_balance?: number): Promise<AccountResponse> {
    const { data, error } = await this.supabase
      .from("accounts")
      .insert({
        user_id: this.user.id,
        name: name.trim(),
        type,
        source: "manual",
        currency,
        current_balance: current_balance ?? null,
        balance_as_of: current_balance != null ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
       throw new Error("Failed to create account");
    }

    return {
      ...data,
      institution_name: null,
      needs_reauth: false,
      last_synced_at: null,
    };
  }
}
