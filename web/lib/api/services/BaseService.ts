import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export abstract class BaseService {
  protected readonly supabase: SupabaseClient<Database>;
  protected readonly user: User;

  constructor(supabase: SupabaseClient<Database>, user: User) {
    this.supabase = supabase;
    this.user = user;
  }
}
