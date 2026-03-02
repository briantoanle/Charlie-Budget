"use client";

import Link from "next/link";
import { LayoutGrid, TrendingUp, BarChart3, Tag } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/ui/motion-primitives";

const links = [
  { href: "/budgets", label: "Budgets", icon: LayoutGrid },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Categories", icon: Tag },
] as const;

export function QuickLinks() {
  return (
    <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {links.map(({ href, label, icon: Icon }) => (
        <StaggerItem key={href}>
          <Link
            href={href}
            className="card-hover flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:text-positive"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </Link>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
