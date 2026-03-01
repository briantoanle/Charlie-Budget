import type { Database } from "@/lib/supabase/database.types";

export type { Database };

// Helper to extract row/insert/update types from the generated schema
type Tables = Database["public"]["Tables"];

// Row types (what SELECT returns)
export type Account = Tables["accounts"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type BudgetLine = Tables["budget_lines"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type PlaidItem = Tables["plaid_items"]["Row"];
export type FxRate = Tables["fx_rates"]["Row"];
export type AuditLogEntry = Tables["audit_log"]["Row"];

// Insert types (what INSERT accepts)
export type AccountInsert = Tables["accounts"]["Insert"];
export type CategoryInsert = Tables["categories"]["Insert"];
export type TransactionInsert = Tables["transactions"]["Insert"];
export type BudgetInsert = Tables["budgets"]["Insert"];
export type BudgetLineInsert = Tables["budget_lines"]["Insert"];

// Update types (what UPDATE accepts)
export type AccountUpdate = Tables["accounts"]["Update"];
export type CategoryUpdate = Tables["categories"]["Update"];
export type TransactionUpdate = Tables["transactions"]["Update"];
export type BudgetLineUpdate = Tables["budget_lines"]["Update"];
export type ProfileUpdate = Tables["profiles"]["Update"];
