import { BaseService } from "./BaseService";
import { ProfileResponse } from "@/lib/api/hooks";

export class ProfileService extends BaseService {
  async getProfile(): Promise<ProfileResponse> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", this.user.id)
      .single();

    if (error?.code !== 'PGRST116') {
      if (error) { // If there's an error and it's not the "not found" error
        throw new Error("Failed to fetch profile");
      }
    }

    if (!data) { // If no data is found (either due to PGRST116 or genuinely no data)
      return {
        id: this.user.id, // Keep this.user.id as it's consistent with the class context
        display_name: "",
        base_currency: "USD",
        country: "US", // Add country
        created_at: new Date().toISOString(),
      };
    }

    return data as ProfileResponse;
  }

  async updateProfileDisplayName(displayName: string): Promise<ProfileResponse> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", this.user.id)
      .select()
      .single();

    if (error) {
       throw new Error("Failed to update profile");
    }

    return data as ProfileResponse;
  }

  async updateBaseCurrency(currency: string): Promise<{ base_currency: string }> {
      const { data, error } = await this.supabase
        .from("profiles")
        .update({ base_currency: currency })
        .eq("id", this.user.id)
        .select("base_currency")
        .single();
    
      if (error) {
        throw new Error("Failed to update base currency");
      }

      return data as { base_currency: string };
  }
}
