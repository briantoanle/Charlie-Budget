import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function PATCH(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { display_name } = body;

  if (!display_name || typeof display_name !== "string" || !display_name.trim()) {
    return error("display_name is required", 400);
  }

  if (display_name.length > 100) {
    return error("display_name must be 100 characters or less", 400);
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update({ display_name: display_name.trim() })
    .eq("id", user.id)
    .select()
    .single();

  if (dbError || !data) return error("Failed to update profile", 500);

  return json(data);
}
