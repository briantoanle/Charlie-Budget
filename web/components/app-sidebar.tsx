"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/lib/actions/auth";
import { motion } from "motion/react";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Accounts", href: "/accounts", icon: Landmark },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Categories", href: "/categories", icon: Tags },
  { title: "Budgets", href: "/budgets", icon: PiggyBank },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Investments", href: "/investments", icon: TrendingUp },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-positive text-primary-foreground shadow-[0_0_12px_rgba(139,154,107,0.4)]">
                  <span className="text-sm font-bold">C</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none px-1">
                  <span className="font-semibold tracking-tight">Charlie</span>
                  <span className="text-xs text-muted-foreground">Budget</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="relative group transition-all duration-300"
                    >
                      <Link href={item.href} className="flex items-center gap-2 w-full">
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 z-0 bg-muted/80 backdrop-blur-sm rounded-md shadow-inner"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <item.icon className={cn(
                          "relative z-10 transition-colors duration-300",
                          isActive ? "text-positive" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <span className={cn(
                          "relative z-10 transition-colors duration-300",
                          isActive ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>{item.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-indicator"
                            className="absolute left-0 top-2 bottom-2 w-1 bg-positive rounded-r-full shadow-[0_0_8px_rgba(139,154,107,0.6)]"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.3 }}
                          />
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

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={pathname === "/settings"}
              className="relative"
            >
              <Link href="/settings">
                {pathname === "/settings" && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 z-0 bg-muted/60 rounded-md"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
                <Settings className="relative z-10" />
                <span className="relative z-10">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => signOutAction()}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

