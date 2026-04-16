"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  BrainCircuit,
  Flame,
  UserSearch,
  History,
  Eye,
  Key,
  CreditCard,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  PanelLeft,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  beta?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Analyze",      icon: Sparkles },
  { href: "/memory",    label: "Memory",        icon: BrainCircuit },
  { href: "/pipeline",  label: "Intent Hub",    icon: Flame },
  { href: "/people",    label: "People",        icon: UserSearch, beta: true },
  { href: "/history",   label: "Score History", icon: History },
  { href: "/watchlist", label: "Watchlist",     icon: Eye },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/billing",   label: "Billing",  icon: CreditCard },
  { href: "/api-keys",  label: "API Keys", icon: Key, comingSoon: true },
];

interface DashboardNavProps {
  creditsRemaining?: number;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function DashboardNav({
  creditsRemaining = 0,
  collapsed = false,
  onToggle,
}: DashboardNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // ── Desktop nav item ──────────────────────────────────────────────────────────

  const renderNavItem = (item: NavItem, mobile?: boolean) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={mobile ? () => setDrawerOpen(false) : undefined}
        title={collapsed && !mobile ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.05em] transition-all duration-200 cursor-pointer border",
          collapsed && !mobile ? "justify-center px-0" : "",
          active
            ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.03] border-transparent"
        )}
      >
        <Icon
          className={cn("h-4 w-4 shrink-0", active ? "text-cyan-400" : "text-slate-400 dark:text-slate-600")}
        />
        {/* Hide labels + badges when collapsed */}
        {(!collapsed || mobile) && (
          <>
            {item.label}
            {"comingSoon" in item && item.comingSoon && (
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-1.5 py-0.5">
                Soon
              </span>
            )}
            {"beta" in item && item.beta && (
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 px-1.5 py-0.5">
                Beta
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const navContent = (mobile?: boolean) => (
    <>
      {NAV_ITEMS.map((item) => renderNavItem(item, mobile))}
      <div className="my-1 border-t border-slate-200 dark:border-white/[0.06]" />
      {BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item, mobile))}
    </>
  );

  // ── Credits block ─────────────────────────────────────────────────────────────

  const creditsBlock = collapsed ? (
    // Icon-only credits pill when collapsed
    <div
      title={`${creditsRemaining} credits`}
      className={cn(
        "flex items-center justify-center px-0 py-2.5 border",
        creditsRemaining < 5
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]"
      )}
    >
      <span className={`text-xs font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
        {creditsRemaining}
      </span>
    </div>
  ) : (
    <div className={`px-3 py-2.5 border ${creditsRemaining < 5 ? "border-amber-500/30 bg-amber-500/5" : "border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]"}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-0.5">Credits</p>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-800 dark:text-slate-200"}`}>
          {creditsRemaining}
          {creditsRemaining < 5 && (
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5">
              Low
            </span>
          )}
        </span>
        <Link href="/billing" className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors tracking-[0.1em]">
          Top up →
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-30 flex lg:hidden items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-white/90 dark:bg-black/90 backdrop-blur-sm">
        <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.2em] font-bold">[ INTENT IQ ]</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-400"}`}>
            {creditsRemaining} cr
          </span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[min(256px,85vw)] bg-white dark:bg-black border-l border-slate-200 dark:border-white/[0.06] p-4 space-y-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.2em] font-bold">[ INTENT IQ ]</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {navContent(true)}

            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07] space-y-2 mt-4">
              {creditsBlock}
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-xs tracking-[0.05em] text-slate-500 transition-all duration-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/[0.03] border border-transparent cursor-pointer"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <SignOutButton redirectUrl="/">
                <button className="flex w-full items-center gap-3 px-3 py-2.5 text-xs tracking-[0.05em] text-slate-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 border border-transparent cursor-pointer">
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-black/80 fixed top-0 left-0 h-screen z-20 transition-[width] duration-300 ease-out overflow-hidden",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header: logo + collapse toggle */}
        <div className={cn("flex items-center border-b border-slate-200 dark:border-white/[0.06] shrink-0", collapsed ? "justify-center py-4 px-0" : "justify-between px-5 py-4")}>
          {!collapsed && (
            <div>
              <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.2em] font-bold">[ INTENT IQ ]</span>
              <p className="text-slate-400 text-[10px] tracking-[0.15em] mt-0.5">v1.0</p>
            </div>
          )}
          <button
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all duration-200 cursor-pointer",
              collapsed ? "" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft
              className={cn("h-4 w-4 transition-transform duration-300", collapsed ? "rotate-180" : "")}
            />
          </button>
        </div>

        {/* Nav items */}
        <div className={cn("flex-1 overflow-y-auto py-3 space-y-0.5", collapsed ? "px-2" : "px-4")}>
          {navContent()}
        </div>

        {/* Bottom actions */}
        <div className={cn("shrink-0 border-t border-slate-200 dark:border-white/[0.07] py-3 space-y-1", collapsed ? "px-2" : "px-4")}>
          {creditsBlock}

          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className={cn(
              "flex w-full items-center gap-3 py-2.5 text-xs tracking-[0.05em] text-slate-500 transition-all duration-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.03] border border-transparent cursor-pointer",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
          </button>

          <SignOutButton redirectUrl="/">
            <button
              title="Sign out"
              className={cn(
                "flex w-full items-center gap-3 py-2.5 text-xs tracking-[0.05em] text-slate-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 border border-transparent cursor-pointer",
                collapsed ? "justify-center px-0" : "px-3"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sign out"}
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
