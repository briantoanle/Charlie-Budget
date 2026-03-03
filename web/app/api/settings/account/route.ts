import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "@/lib/api/auth";
import { error, noContent } from "@/lib/api/response";
import {
  APP_SESSION_COOKIE_NAME,
  clearSessionCookieOptions,
} from "@/lib/session";

export async function DELETE(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();

  if (body.confirm !== "DELETE") {
    return error('confirm must be exactly "DELETE"', 400);
  }

  // 1. Revoke all Plaid access tokens
  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id, access_token_enc")
    .eq("user_id", user.id);

  if (plaidItems && plaidItems.length > 0) {
    try {
      const { plaidClient } = await import("@/lib/plaid/client");
      for (const item of plaidItems) {
        if (item.access_token_enc) {
          try {
            await plaidClient.itemRemove({
              access_token: item.access_token_enc,
            });
          } catch {
            // Non-fatal — continue with deletion
          }
        }
      }
    } catch {
      // Plaid client import failure — continue
    }
  }

  // 2. Write final audit log entry
  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "account_deleted",
    table_name: "profiles",
    record_id: user.id,
    diff: { reason: "User requested account deletion" },
  });

  // 3. Delete all user data (order matters for FK constraints)
  const { data: budgetIds } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id);

  if (budgetIds && budgetIds.length > 0) {
    await supabase
      .from("budget_lines")
      .delete()
      .in("budget_id", budgetIds.map((b) => b.id));
  }

  await supabase.from("budgets").delete().eq("user_id", user.id);
  await supabase.from("transactions").delete().eq("user_id", user.id);
  await supabase.from("plaid_items").delete().eq("user_id", user.id);
  await supabase.from("accounts").delete().eq("user_id", user.id);
  await supabase.from("categories").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  // 4. Sign out (invalidate session)
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.set(APP_SESSION_COOKIE_NAME, "", clearSessionCookieOptions());

  return noContent();
}
