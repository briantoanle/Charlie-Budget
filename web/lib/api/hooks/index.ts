// API Hooks — barrel re-export
// Import from "@/lib/api/hooks" continues to work for all consumers.

export { useAccounts, useSuspenseAccounts, useDeleteAccount } from "./accounts";

export {
  useTransactions,
  useSuspenseTransactions,
  useSpendingMap,
  useCreateTransaction,
  useUpdateTransaction,
} from "./transactions";

export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./categories";

export {
  useBudget,
  useCreateBudget,
  useCopyBudget,
  useAddBudgetLine,
  useUpdateBudgetLine,
  useDeleteBudgetLine,
} from "./budgets";

export {
  useSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from "./savings-goals";

export {
  useProfile,
  useSuspenseProfile,
  useUpdateProfile,
  useUpdateCurrency,
  useDeleteUserAccount,
  useExportData,
} from "./settings";

export { useSyncPlaidItem, useDisconnectPlaidItem } from "./plaid";

export {
  useMonthlyTrend,
  useCategoryBreakdown,
  useReportSummary,
  useReportSpendingFlow,
} from "./reports";

export {
  useInvestmentAccounts,
  useCreateInvestmentAccount,
  useHoldings,
  useTrades,
  useCreateTrade,
  useDividends,
  useCreateDividend,
} from "./investments";

// Re-export all types so `import { AccountResponse } from "@/lib/api/hooks"` still works
export type {
  AccountResponse,
  TransactionResponse,
  TransactionPagination,
  CategoryResponse,
  BudgetResponse,
  BudgetLineResponse,
  MonthlyTrendPoint,
  CategoryBreakdownItem,
  ReportSummary,
  ReportSummaryCategory,
  ReportSummaryMetricDelta,
  ReportFlowNode,
  ReportFlowLink,
  ReportSpendingFlow,
  SpendHotspot,
  SpendMapResponse,
  SavingsGoalResponse,
  ProfileResponse,
  InvestmentAccountResponse,
  HoldingResponse,
  TradeResponse,
  DividendResponse,
} from "../types";
