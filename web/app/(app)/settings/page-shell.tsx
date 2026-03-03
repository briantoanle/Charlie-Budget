"use client";

import { type ReactNode } from "react";
import { PageTransition, FadeIn } from "@/components/ui/motion-primitives";

export function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and preferences
          </p>
        </FadeIn>
        {children}
      </div>
    </PageTransition>
  );
}
