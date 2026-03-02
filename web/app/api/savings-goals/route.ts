import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const include_archived = sp.get("include_archived") === "true";

  let query = supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (!include_archived) {
    query = query.eq("archived", false);
  }

  const { data, error: dbError } = await query;

  if (dbError) return error("Failed to fetch savings goals", 500);

  return json({ goals: data });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { name, target_amount, current_amount, currency, target_date, color, emoji } = body;

  if (!name) return error("name is required", 400);
  if (target_amount == null || typeof target_amount !== "number") {
    return error("target_amount is required and must be a number", 400);
  }

  const { data, error: dbError } = await supabase
    .from("savings_goals")
    .insert({
      user_id: user.id,
      name,
      target_amount,
      current_amount: current_amount ?? 0,
      currency: currency ?? "USD",
      target_date: target_date ?? null,
      color: color ?? null,
      emoji: emoji ?? null,
    })
    .select()
    .single();

  if (dbError) {
    return error("Failed to create savings goal", 500);
  }

  return created({ goal: data });
}
