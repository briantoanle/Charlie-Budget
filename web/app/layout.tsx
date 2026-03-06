import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Charlie Finance Hub",
    template: "%s · Charlie Finance Hub",
  },
  description: "Modern personal finance dashboard built on Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
