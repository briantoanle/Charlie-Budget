"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  BarChart3,
  TrendingUp,
  Settings,
  Plus,
  Search,
} from "lucide-react";

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: Landmark },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { name: "Log a Trade", href: "/investments?tab=trades", icon: Plus },
  { name: "Add Budget Line", href: "/budgets", icon: Plus },
  { name: "Search Transactions", href: "/transactions", icon: Search },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to page, search, or run an action…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => navigate(page.href)}
              className="gap-2"
            >
              <page.icon className="h-4 w-4 text-muted-foreground" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.name}
              onSelect={() => navigate(action.href)}
              className="gap-2"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              {action.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
