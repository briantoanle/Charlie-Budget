import type { Metadata } from "next";
import Image from "next/image";

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_16%,hsl(166_58%_84%)_0%,transparent_32%),radial-gradient(circle_at_86%_84%,hsl(18_78%_84%)_0%,transparent_30%),linear-gradient(140deg,hsl(35_45%_95%)_0%,hsl(172_32%_95%)_55%,hsl(212_38%_94%)_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[hsl(196_86%_60%/0.2)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[hsl(28_88%_62%/0.18)] blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2.15rem] border border-foreground/15 bg-white/90 shadow-[0_28px_90px_-36px_hsl(var(--foreground)/0.45)] backdrop-blur-sm md:grid-cols-[1fr_1fr]">
          <aside className="relative hidden overflow-hidden border-r border-foreground/10 bg-[linear-gradient(170deg,hsl(198_31%_16%)_0%,hsl(198_25%_12%)_56%,hsl(28_60%_26%)_100%)] p-9 text-white md:flex md:flex-col md:justify-between">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(180_60%_70%/0.22)_0%,transparent_34%),radial-gradient(circle_at_88%_86%,hsl(28_94%_64%/0.24)_0%,transparent_38%)]" />
            <div className="relative space-y-6">
              <Image
                src="/charlie-logo.svg"
                alt="Charlie logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-2xl ring-1 ring-white/25"
              />
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight">
                  Charlie
                </h1>
                <p className="max-w-sm text-[15px] leading-7 text-white/78">
                  Modern money control for people who want signal over noise.
                </p>
              </div>
            </div>
            <div className="relative space-y-5 rounded-3xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                Why it works
              </p>
              <div className="space-y-2.5 text-sm text-white/90">
                <p>Live account view with clean categorization</p>
                <p>Simple goal tracking without spreadsheet overhead</p>
                <p>Reports that explain, not overwhelm</p>
              </div>
            </div>
          </aside>

          <main className="p-5 sm:p-8 md:p-10 lg:p-12">
            <div className="mb-7 flex items-center gap-3 md:hidden">
              <Image
                src="/charlie-logo.svg"
                alt="Charlie logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl"
              />
              <div>
                <p className="text-base font-semibold tracking-tight">Charlie</p>
                <p className="text-xs text-muted-foreground">
                  Spend smarter, not harder
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
