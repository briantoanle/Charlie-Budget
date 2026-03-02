import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { currency } = body;

  if (!currency || typeof currency !== "string" || currency.length !== 3) {
    return error("Invalid currency code", 400);
  }

  const newCurrency = currency.toUpperCase();

  // Get all transactions that need conversion
  const { data: txns, error: txnError } = await supabase
    .from("transactions")
    .select("id, txn_date, amount, currency")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (txnError) return error("Failed to fetch transactions", 500);

  // Gather unique dates that need FX rate lookups
  const uniqueDates = new Set<string>();
  for (const txn of txns ?? []) {
    if (txn.currency !== newCurrency) {
      uniqueDates.add(txn.txn_date);
    }
  }

  // Fetch or cache FX rates for each unique date
  // fx_rates table: { date, fetched_at, rates (JSON with currency codes as keys) }
  const ratesByDate = new Map<string, Record<string, number>>();

  for (const date of uniqueDates) {
    // Check cache first
    const { data: cached } = await supabase
      .from("fx_rates")
      .select("rates")
      .eq("date", date)
      .single();

    if (cached) {
      ratesByDate.set(date, cached.rates as Record<string, number>);
      continue;
    }

    // Fetch from Open Exchange Rates
    const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (!OXR_APP_ID) {
      return error("Exchange rate service not configured", 500);
    }

    try {
      const res = await fetch(
        `https://openexchangerates.org/api/historical/${date}.json?app_id=${OXR_APP_ID}`
      );
      if (!res.ok) throw new Error("OXR API error");
      const oxrData = await res.json();

      if (!oxrData.rates) {
        return error(`No exchange rates available for ${date}`, 500);
      }

      ratesByDate.set(date, oxrData.rates);

      // Cache the rates
      await supabase.from("fx_rates").insert({
        date,
        rates: oxrData.rates,
      });
    } catch {
      return error(`Failed to fetch exchange rate for ${date}`, 500);
    }
  }

  // Batch update transactions
  for (const txn of txns ?? []) {
    if (txn.currency === newCurrency) {
      // Same currency — amount_base = amount
      await supabase
        .from("transactions")
        .update({ amount_base: txn.amount })
        .eq("id", txn.id);
    } else {
      const rates = ratesByDate.get(txn.txn_date);
      if (rates) {
        const fromRate = rates[txn.currency];
        const toRate = rates[newCurrency];
        if (fromRate && toRate) {
          // Convert: amount in fromCurrency → USD → newCurrency
          const amountBase = txn.amount * (toRate / fromRate);
          await supabase
            .from("transactions")
            .update({ amount_base: amountBase })
            .eq("id", txn.id);
        }
      }
    }
  }

  // Update the user's base_currency
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ base_currency: newCurrency })
    .eq("id", user.id);

  if (profileError) return error("Failed to update profile", 500);

  return json({ base_currency: newCurrency });
}
