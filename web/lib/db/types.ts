
export type { Database } from "@/lib/supabase/database.types";


export type UUID = string;

export type AccountType = "checking" | "savings" | "credit" | "cash";

export type Account = {
    id: UUID;
    user_id: UUID;
    name: string;
    type: AccountType;
    currency: string; // ISO 4217, e.g. "USD"
    created_at: string;
};

export type Transaction = {
    id: UUID;
    user_id: UUID;
    account_id: UUID;
    category_id: UUID | null;
    txn_date: string; // YYYY-MM-DD
    amount_minor: number; // BIGINT in DB, number in JS (careful if you exceed 2^53-1)
    currency: string;
    merchant: string | null;
    notes: string | null;
    is_deleted: boolean;
    created_at: string;
};