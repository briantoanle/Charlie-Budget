import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charlie Budget",
  description: "Sign in to your Charlie Budget account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        {/* Branding */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-card border border-border">
            <span className="text-xl font-bold tracking-tight text-positive">C</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            Charlie Budget
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal budgeting & investment tracking
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
