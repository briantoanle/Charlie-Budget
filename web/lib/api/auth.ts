import { supabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AuthResult =
  | { user: User; supabase: SupabaseClient<Database>; error: null }
  | { user: null; supabase: null; error: Response };

export async function getAuth(): Promise<AuthResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, error: null };
}
