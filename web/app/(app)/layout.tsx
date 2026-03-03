import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
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
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border/50 bg-card/50 px-4 backdrop-blur-md">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="ml-auto flex items-center gap-3">
            <div
              className="flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary px-2 text-xs font-medium text-secondary-foreground"
              aria-label="Current user"
            >
              You
            </div>
          </div>
        </header>
        <main className="page-content flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
      <CommandPalette />
      <OnboardingWizard />
      <ChatWidget />
    </SidebarProvider>
  );
}
