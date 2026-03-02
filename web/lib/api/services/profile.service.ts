import { BaseService } from "./BaseService";
import { ProfileResponse } from "@/lib/api/hooks";

export class ProfileService extends BaseService {
  async getProfile(): Promise<ProfileResponse> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", this.user.id)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') {
        throw new Error("Failed to fetch profile");
      }
      return {
        id: this.user.id,
        display_name: "",
        base_currency: "USD",
        created_at: new Date().toISOString()
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
