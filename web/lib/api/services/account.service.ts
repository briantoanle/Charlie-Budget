import { BaseService } from "./BaseService";
import { AccountResponse } from "@/lib/api/hooks";

export class AccountService extends BaseService {
  async getAccounts(): Promise<AccountResponse[]> {
    const { data, error } = await this.supabase
      .from("accounts")
      .select("*, plaid_items(institution_name, needs_reauth, last_synced_at)")
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("Failed to fetch accounts");
    }

    const accounts = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      source: row.source,
      currency: row.currency,
      current_balance: row.current_balance,
      balance_as_of: row.balance_as_of,
      plaid_item_id: row.plaid_item_id,
      institution_name: row.plaid_items?.institution_name ?? null,
      needs_reauth: row.plaid_items?.needs_reauth ?? false,
      last_synced_at: row.plaid_items?.last_synced_at ?? null,
      archived: row.archived,
      created_at: row.created_at,
    }));

    return accounts;
  }

  async createAccount(name: string, type: string, currency: string = "USD", current_balance?: number): Promise<any> {
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

    return data;
  }
}
