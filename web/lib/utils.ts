import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency.
 * @param value  The numeric value to format
 * @param currency  ISO 4217 currency code (default "USD")
 */
export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Build a URLSearchParams string from an object, omitting undefined/null/empty values.
 */
export function buildSearchParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      sp.set(key, String(val));
    }
  });
  return sp.toString();
}
