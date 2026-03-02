import { getAuth } from "@/lib/api/auth";
import { ProfileService } from "@/lib/api/services/profile.service";
import { AccountService } from "@/lib/api/services/account.service";
import { redirect } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { SettingsClientComponents } from "./client-components";

export default async function SettingsPage() {
  const auth = await getAuth();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }

  const queryClient = new QueryClient();
  const profileService = new ProfileService(auth.supabase, auth.user);
  const accountService = new AccountService(auth.supabase, auth.user);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["profile"],
      queryFn: () => profileService.getProfile(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["accounts"],
      queryFn: () => accountService.getAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SettingsClientComponents />
        </HydrationBoundary>
      </div>
    </div>
  );
}
