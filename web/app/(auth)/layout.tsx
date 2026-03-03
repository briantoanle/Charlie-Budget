import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charlie",
  description: "Sign in to your Charlie account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,hsl(215_35%_96%)_0%,hsl(150_35%_96%)_55%,hsl(52_35%_95%)_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-success/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-foreground/10 bg-card/90 shadow-[0_28px_90px_-36px_hsl(var(--foreground)/0.45)] backdrop-blur-sm md:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden overflow-hidden border-r border-foreground/10 bg-[linear-gradient(180deg,hsl(var(--foreground)/0.96)_0%,hsl(var(--foreground)/0.88)_100%)] p-8 text-white md:flex md:flex-col md:justify-between">
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <span className="text-xl font-semibold tracking-tight">C</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                  Charlie
                </h1>
                <p className="max-w-sm text-sm leading-6 text-white/75">
                  Your everyday finance command center. Track spending and stay
                  in control without the noise.
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                Built for clarity
              </p>
              <p className="text-sm text-white/90">
                Accounts, transactions, goals, and reports in one simple flow.
              </p>
            </div>
          </aside>

          <main className="p-5 sm:p-8 md:p-10">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                <span className="text-lg font-semibold tracking-tight">C</span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">Charlie</p>
                <p className="text-xs text-muted-foreground">
                  Friendly personal finance hub
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
