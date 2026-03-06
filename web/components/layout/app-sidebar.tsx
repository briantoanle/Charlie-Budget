"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  CreditCard,
  Map,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Accounts", href: "/accounts", icon: Landmark },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Budgets", href: "/budgets", icon: CreditCard },
  { title: "Spending Map", href: "/spending-map", icon: Map },
];

const bottomItems = [
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/charlie-logo.svg"
            alt="Charlie logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl"
          />
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">
              Charlie
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                          isActive && "bg-sidebar-accent font-medium text-foreground"
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        {!collapsed && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu>
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                      isActive && "bg-sidebar-accent font-medium text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOutAction()}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {!collapsed && <span className="text-sm">Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
