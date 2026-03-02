import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { format } = body;

  if (!format || !["csv", "json"].includes(format)) {
    return error("format must be 'csv' or 'json'", 400);
  }

  // Fetch all user data
  const [accountsRes, transactionsRes, categoriesRes, budgetsRes] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at"),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("txn_date", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order"),
      supabase
        .from("budgets")
        .select("*, budget_lines(*)")
        .eq("user_id", user.id)
        .order("month"),
    ]);

  if (format === "json") {
    const exportData = {
      exported_at: new Date().toISOString(),
      accounts: accountsRes.data ?? [],
      transactions: transactionsRes.data ?? [],
      categories: categoriesRes.data ?? [],
      budgets: budgetsRes.data ?? [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="charlie-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // CSV: export transactions only (most useful for analysis)
  const txns = transactionsRes.data ?? [];
  const headers = [
    "id",
    "txn_date",
    "amount",
    "amount_base",
    "currency",
    "merchant",
    "note",
    "pending",
    "source",
    "category_id",
    "account_id",
    "created_at",
  ];

  const csvRows = [headers.join(",")];
  for (const txn of txns) {
    const row = headers.map((h) => {
      const val = (txn as Record<string, unknown>)[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape CSV values that contain commas or quotes
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(row.join(","));
  }

  return new Response(csvRows.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="charlie-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
