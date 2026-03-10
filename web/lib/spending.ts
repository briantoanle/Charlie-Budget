type SpendingTransaction = {
  amount: number;
  merchant?: string | null;
  note?: string | null;
  account_name?: string | null;
  excludeFromSpending?: boolean;
};

const SPENDING_EXCLUSION_KEYWORDS = ["360 checking", "transfer to"];

export function shouldExcludeFromSpending(transaction: Omit<SpendingTransaction, "amount">) {
  const description = [transaction.merchant, transaction.note, transaction.account_name]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return SPENDING_EXCLUSION_KEYWORDS.some((keyword) => description.includes(keyword));
}

export function annotateExcludedSpendingTransactions<T extends SpendingTransaction>(transactions: T[]) {
  return transactions.map((transaction) => ({
    ...transaction,
    excludeFromSpending:
      transaction.excludeFromSpending ?? shouldExcludeFromSpending(transaction),
  }));
}

export function calculateTotalSpending<T extends SpendingTransaction>(transactions: T[]) {
  return transactions.reduce((total, transaction) => {
    if (transaction.amount >= 0 || transaction.excludeFromSpending) {
      return total;
    }

    return total + Math.abs(transaction.amount);
  }, 0);
}
