import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET() {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data, error: dbError } = await supabase
    .from("investment_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (dbError) return error("Failed to fetch investment accounts", 500);

  return json({ accounts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { name, broker, currency } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return error("name is required", 400);
  }
  if (!currency || typeof currency !== "string") {
    return error("currency is required", 400);
  }

  const { data, error: dbError } = await supabase
    .from("investment_accounts")
    .insert({
      user_id: user.id,
      name: name.trim(),
      broker: broker || null,
      currency,
    })
    .select()
    .single();

  if (dbError) return error("Failed to create investment account", 500);

  return created(data);
}
