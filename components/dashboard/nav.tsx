"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PLAN_CREDITS, type DbUser } from "@/lib/types";
import {
  LayoutGrid,
  Flame,
  Gauge,
  GitBranch,
  UserSearch,
  Eye,
  Zap,
  Inbox,
  CreditCard,
  Key,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  PanelLeft,
  ChevronDown,
  Search,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count?: string;
  indicator?: boolean;
  hotCount?: boolean;
  beta?: boolean;
  comingSoon?: boolean;
}

const WORKSPACE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/analyze", label: "Analyze", icon: MessageSquare },
  { href: "/pipeline", label: "Intent Hub", icon: Flame, count: "●12", hotCount: true },
  { href: "/score", label: "Score", icon: Gauge },
  { href: "/history", label: "Pipeline", icon: GitBranch },
  { href: "/people", label: "People", icon: UserSearch, beta: true },
  { href: "/watchlist", label: "Watchlist", icon: Eye, count: "24" },
  { href: "/autopilot", label: "Autopilot", icon: Zap, indicator: true },
  { href: "/memory", label: "Inbox", icon: Inbox, count: "12" },
];

const LIST_ITEMS: (Omit<NavItem, "icon"> & { dotClass: string })[] = [
  { href: "/watchlist", label: "Q1 Targets", dotClass: "bg-[#4ade80]", count: "42" },
  { href: "/watchlist", label: "Enterprise SaaS", dotClass: "bg-[#7170ff]", count: "86" },
  { href: "/watchlist", label: "Just funded ('26)", dotClass: "bg-[#f5b544]", count: "31" },
  { href: "/watchlist", label: "Detected: Snowflake", dotClass: "bg-[#4ec9d8]", count: "119" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/api-keys", label: "API Keys", icon: Key, comingSoon: true },
];

function ListDot({ className }: { className?: string }) {
  return <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} aria-hidden />;
}

interface DashboardNavProps {
  creditsRemaining?: number;
  plan: DbUser["plan"];
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function DashboardNav({
  creditsRemaining = 0,
  plan,
  collapsed = false,
  onToggle,
}: DashboardNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const creditCap = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const creditPct = creditCap > 0 ? Math.min(100, Math.round((creditsRemaining / creditCap) * 100)) : 0;
  const displayName = user?.fullName || user?.firstName || "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    email.slice(0, 2).toUpperCase() ||
    "IQ";

  const itemClass = (active: boolean, narrow: boolean) =>
    cn(
      "flex items-center gap-2 rounded px-2.5 py-[5px] text-[13px] tracking-[-0.011em] transition-colors cursor-pointer border border-transparent",
      narrow && collapsed ? "justify-center px-0" : "",
      active
        ? "bg-white/[0.06] text-[#f7f8f8]"
        : "text-[#b4bbc8] hover:bg-white/[0.04] hover:text-[#f7f8f8]"
    );

  const renderItem = (item: NavItem, mobile?: boolean) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={item.href}
        onClick={mobile ? () => setDrawerOpen(false) : undefined}
        title={collapsed && !mobile ? item.label : undefined}
        className={itemClass(active, !!mobile)}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
        {(!collapsed || mobile) && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.comingSoon && (
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[#62666d]">
                Soon
              </span>
            )}
            {item.beta && !item.comingSoon && (
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[#7170ff]">
                Beta
              </span>
            )}
            {item.count && (
              <span
                className={cn(
                  "ml-auto font-mono text-[11px] text-[#8a8f98]",
                  item.hotCount && "text-[#4ade80]"
                )}
              >
                {item.count}
              </span>
            )}
            {item.indicator && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />}
          </>
        )}
      </Link>
    );
  };

  const creditsInner = (
    <>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#8a8f98]">Credits this month</p>
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-mono text-base font-semibold tracking-[-0.02em] text-[#f7f8f8]">
            {creditsRemaining.toLocaleString()}
          </span>
          <span className="ml-0.5 text-[11px] text-[#8a8f98]"> / {creditCap.toLocaleString()}</span>
        </div>
        <Link href="/billing" className="text-[11px] font-medium text-[#7170ff] hover:text-[#c9c4ff]">
          Top up
        </Link>
      </div>
      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4ec9d8] to-[#5e6ad2]"
          style={{ width: `${creditPct}%` }}
        />
      </div>
    </>
  );

  const navBlock = (mobile?: boolean) => (
    <>
      <p
        className={cn(
          "flex items-center justify-between px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-[#62666d]",
          collapsed && !mobile && "justify-center px-0"
        )}
      >
        {(!collapsed || mobile) && "Workspace"}
      </p>
      {WORKSPACE_ITEMS.map((item) => renderItem(item, mobile))}

      <p
        className={cn(
          "mt-1 flex items-center justify-between px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-[#62666d]",
          collapsed && !mobile && "hidden"
        )}
      >
        Lists
        <span className="grid h-4 w-4 cursor-pointer place-items-center rounded hover:bg-white/[0.06]">
          <Plus className="h-3 w-3 text-[#8a8f98]" />
        </span>
      </p>
      {(!collapsed || mobile) &&
        LIST_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={mobile ? () => setDrawerOpen(false) : undefined}
            className="flex items-center gap-2 rounded px-2.5 py-[5px] text-[13px] tracking-[-0.011em] text-[#b4bbc8] transition-colors hover:bg-white/[0.04] hover:text-[#f7f8f8]"
          >
            <ListDot className={item.dotClass} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count && (
              <span className="ml-auto font-mono text-[11px] text-[#8a8f98]">{item.count}</span>
            )}
          </Link>
        ))}

      <div className="my-2 mx-1 h-px bg-white/[0.08]" />

      {BOTTOM_ITEMS.map((item) => renderItem(item, mobile))}
    </>
  );

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-white/[0.08] bg-[#0a0b0d] px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.02em] text-[#f7f8f8]">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#4ec9d8] via-[#5e6ad2] to-[#7170ff] font-mono text-[11px] font-extrabold text-[#0a0b0f]">
            IQ
          </span>
          IntentIQ
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#8a8f98]">{creditsRemaining}</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1 text-[#8a8f98] hover:text-[#f7f8f8]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 right-0 top-0 flex w-[min(280px,88vw)] flex-col border-l border-white/[0.08] bg-[#0a0b0d] p-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#f7f8f8]">Menu</span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="p-1 text-[#8a8f98]" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto">{navBlock(true)}</div>
            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">{creditsInner}</div>
              <button
                type="button"
                onClick={toggleTheme}
                className="mt-2 flex w-full items-center gap-2 rounded px-2 py-2 text-[13px] text-[#b4bbc8] hover:bg-white/[0.04]"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Theme
              </button>
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-[13px] text-[#b4bbc8] hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-20 hidden h-screen flex-col overflow-hidden border-r border-white/[0.08] bg-[#0a0b0d] py-3 transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-16 px-2" : "w-[232px] px-2"
        )}
      >
        <button
          type="button"
          className={cn(
            "mb-1.5 flex cursor-pointer items-center gap-2 rounded border border-transparent px-2 py-1 pb-3 hover:bg-white/[0.02]",
            collapsed && "justify-center px-0"
          )}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[#4ec9d8] via-[#5e6ad2] to-[#7170ff] font-mono text-[11px] font-extrabold text-[#0a0b0f]">
            IQ
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px] font-medium tracking-[-0.011em] text-[#f7f8f8]">Acme Sales</div>
              <span className="block text-[11px] font-normal text-[#8a8f98]">Workspace · {plan}</span>
            </div>
          )}
          {!collapsed && <ChevronDown className="h-3 w-3 shrink-0 text-[#8a8f98]" />}
        </button>

        {!collapsed && (
          <div className="mx-1 mb-2 flex cursor-pointer items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[13px] text-[#8a8f98] hover:border-white/[0.13] hover:bg-white/[0.05]">
            <Search className="h-3 w-3 opacity-70" />
            <span>Search</span>
            <kbd className="ml-auto rounded border border-white/[0.06] bg-white/[0.06] px-1.5 py-px font-mono text-[11px]">
              ⌘K
            </kbd>
          </div>
        )}

        <div className={cn("min-h-0 flex-1 space-y-0.5 overflow-y-auto", collapsed ? "px-0" : "px-1")}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-1 py-2">
              {WORKSPACE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded border border-transparent text-[#b4bbc8] hover:bg-white/[0.04] hover:text-[#f7f8f8]",
                      active && "bg-white/[0.06] text-[#f7f8f8]"
                    )}
                  >
                    <Icon className="h-4 w-4 opacity-75" />
                  </Link>
                );
              })}
            </div>
          ) : (
            navBlock()
          )}
        </div>

        <div className="mt-auto shrink-0 space-y-2 px-1 pt-2">
          {!collapsed && (
            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">{creditsInner}</div>
          )}
          {collapsed && (
            <div title={`${creditsRemaining} credits`} className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-white/[0.08] font-mono text-xs text-[#f7f8f8]">
              {creditsRemaining}
            </div>
          )}

          <div className="mx-0 my-2 h-px bg-white/[0.08]" />

          <div
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-white/[0.04]",
              collapsed && "justify-center px-0"
            )}
          >
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f5b544] to-[#ec4899] text-[10px] font-bold text-[#0a0b0f]">
              {initials.slice(0, 2)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[#f7f8f8]">{displayName}</div>
                <div className="truncate text-[11px] text-[#8a8f98]">{email}</div>
              </div>
            )}
            {!collapsed && <ChevronDown className="h-3 w-3 shrink-0 text-[#8a8f98]" />}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? "Expand" : "Collapse"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#8a8f98] hover:bg-white/[0.05] hover:text-[#f7f8f8]"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
            {!collapsed && (
              <>
                <button
                  type="button"
                  onClick={toggleTheme}
                  title="Theme"
                  className="grid h-8 w-8 place-items-center rounded text-[#8a8f98] hover:bg-white/[0.05]"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    title="Sign out"
                    className="grid h-8 w-8 place-items-center rounded text-[#8a8f98] hover:bg-red-500/10 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </SignOutButton>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
