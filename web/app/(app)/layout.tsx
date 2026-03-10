export const dynamic = "force-dynamic";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { ChatWidget } from "@/components/guide/chat-widget";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-50">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border/50 bg-gray-50/90 px-4 backdrop-blur-md">
          <SidebarTrigger className="hidden text-muted-foreground hover:text-foreground md:flex" />
          <div className="ml-auto flex items-center gap-3">
            <div
              className="flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary px-2 text-xs font-medium text-secondary-foreground"
              aria-label="Current user"
            >
              You
            </div>
          </div>
        </header>
        <main className="page-content flex flex-1 flex-col overflow-y-auto bg-gray-50 p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <MobileNav />
      <CommandPalette />
      <OnboardingWizard />
      <ChatWidget />
    </SidebarProvider>
  );
}
