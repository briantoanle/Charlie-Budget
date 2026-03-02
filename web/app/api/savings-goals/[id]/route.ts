import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { name, target_amount, current_amount, currency, target_date, color, emoji, archived } = body;

  const { data, error: dbError } = await supabase
    .from("savings_goals")
    .update({
      name,
      target_amount,
      current_amount,
      currency,
      target_date,
      color,
      emoji,
      archived,
    })
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return error("Failed to update savings goal", 500);
  }

  return json({ goal: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error: dbError } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error("Failed to delete savings goal", 500);
  }

  return new Response(null, { status: 204 });
}
