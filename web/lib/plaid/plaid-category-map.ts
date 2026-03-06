/**
 * Maps Plaid's personal_finance_category.primary values
 * to user-friendly category names and kinds.
 *
 * @see https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
 */

export interface CategoryMapping {
  name: string;
  kind: "income" | "expense" | "transfer";
}

/**
 * Plaid primary category → Charlie category mapping.
 * Keys are Plaid's `personal_finance_category.primary` values.
 *
 * Notes:
 * - Plaid's taxonomy evolves (notably PFCv2), so we keep explicit mappings
 *   and also a fallback normalization in `mapPlaidCategory`.
 */
export const PLAID_CATEGORY_MAP: Record<string, CategoryMapping> = {
  // Expenses
  FOOD_AND_DRINK: { name: "Dining Out", kind: "expense" },
  GROCERIES: { name: "Groceries", kind: "expense" },
  TRANSPORTATION: { name: "Transport", kind: "expense" },
  RENT_AND_UTILITIES: { name: "Rent & Utilities", kind: "expense" },
  GENERAL_MERCHANDISE: { name: "Shopping", kind: "expense" },
  ENTERTAINMENT: { name: "Entertainment", kind: "expense" },
  PERSONAL_CARE: { name: "Personal Care", kind: "expense" },
  MEDICAL: { name: "Healthcare", kind: "expense" },
  TRAVEL: { name: "Travel", kind: "expense" },
  HOME_IMPROVEMENT: { name: "Home", kind: "expense" },
  GENERAL_SERVICES: { name: "Services", kind: "expense" },
  GOVERNMENT_AND_NON_PROFIT: { name: "Taxes & Fees", kind: "expense" },
  EDUCATION: { name: "Education", kind: "expense" },
  LOAN_PAYMENTS: { name: "Loan Payments", kind: "expense" },
  BANK_FEES: { name: "Bank Fees", kind: "expense" },

  // Income
  INCOME: { name: "Income", kind: "income" },

  // Transfers
  TRANSFER_IN: { name: "Transfer", kind: "transfer" },
  TRANSFER_OUT: { name: "Transfer", kind: "transfer" },
  TRANSFER: { name: "Transfer", kind: "transfer" },
};

/**
 * Returns the unique set of categories to seed for a new user.
 * Deduplicates by name (e.g., TRANSFER_IN and TRANSFER_OUT both map to "Transfer").
 */
export function getDefaultCategories(): CategoryMapping[] {
  const seen = new Set<string>();
  const result: CategoryMapping[] = [];

  for (const mapping of Object.values(PLAID_CATEGORY_MAP)) {
    if (!seen.has(mapping.name)) {
      seen.add(mapping.name);
      result.push(mapping);
    }
  }

  return result;
}

/**
 * Maps a Plaid primary category string to a Charlie category, or null if unknown.
 */
export function mapPlaidCategory(
  primary: string | undefined | null
): CategoryMapping | null {
  if (!primary) return null;
  const normalized = primary.trim().toUpperCase();

  // Exact documented categories first.
  const exact = PLAID_CATEGORY_MAP[normalized];
  if (exact) return exact;

  // Taxonomy-safe fallback for newer Plaid primary variants.
  if (normalized.startsWith("INCOME")) {
    return { name: "Income", kind: "income" };
  }
  if (normalized.startsWith("TRANSFER")) {
    return { name: "Transfer", kind: "transfer" };
  }
  if (normalized.startsWith("LOAN_PAYMENTS")) {
    return { name: "Loan Payments", kind: "expense" };
  }
  if (normalized.startsWith("BANK_FEES")) {
    return { name: "Bank Fees", kind: "expense" };
  }
  if (normalized.startsWith("RENT_AND_UTILITIES")) {
    return { name: "Rent & Utilities", kind: "expense" };
  }

  return null;
}
