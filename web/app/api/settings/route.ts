import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

import { ProfileService } from "@/lib/api/services/profile.service";

export async function GET() {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  try {
    const profileService = new ProfileService(supabase, user);
    const profile = await profileService.getProfile();
    return json({ profile });
  } catch (err: any) {
    return error(err.message, 404);
  }
}
