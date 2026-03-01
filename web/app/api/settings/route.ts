import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function GET() {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (dbError || !data) return error("Profile not found", 404);

  return json({ profile: data });
}
