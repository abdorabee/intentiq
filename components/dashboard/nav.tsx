"use client";

import { Fragment, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { PLAN_CREDITS, type DbUser } from "@/lib/types";
import { getWorkspaceLabel } from "@/lib/workspace-label";
import {
  LogOut,
  Sun,
  Moon,
  PanelLeft,
  Search,
  X,
} from "lucide-react";
import {
  getVisibleNavigationGroups,
  isNavigationItemActive,
  type DashboardNavigationItem,
} from "@/lib/dashboard-search";
import { useTheme } from "@/components/theme-provider";
import { useDashboardSearch } from "@/components/dashboard/search-provider";
import VesperWiseLogo from "@/components/vesperwise-logo";

interface DashboardNavProps {
  creditsRemaining?: number;
  plan: DbUser["plan"];
  collapsed?: boolean;
  onToggle?: () => void;
  inboxCount?: number;
  watchlistCount?: number;
  pipelineHotCount?: number;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  sidebarRef?: Ref<HTMLElement>;
}

function Tooltip({ label, children, visible }: { label: string; children: ReactNode; visible: boolean }) {
  if (!visible) return children;

  const id = `sidebar-tooltip-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content id={id} className="sb-tooltip" side="right" sideOffset={8}>
          {label}
          <TooltipPrimitive.Arrow className="sb-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export default function DashboardNav({
  creditsRemaining = 0,
  plan,
  collapsed = false,
  onToggle,
  inboxCount,
  watchlistCount,
  pipelineHotCount,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
  sidebarRef,
}: DashboardNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { open: openSearch } = useDashboardSearch();
  const { user } = useUser();
  const creditCap = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const creditPct = creditCap > 0 ? Math.min(100, Math.round((creditsRemaining / creditCap) * 100)) : 0;
  const displayName = user?.fullName || user?.firstName || "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const workspaceLabel = getWorkspaceLabel({ fullName: user?.fullName, email });
  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    email.slice(0, 2).toUpperCase() ||
    "IQ";

  const navigationGroups = getVisibleNavigationGroups();

  function navCount(item: DashboardNavigationItem): string | undefined {
    if (item.count === "inbox" && inboxCount && inboxCount > 0) return String(inboxCount);
    if (item.count === "pipelineHot" && pipelineHotCount && pipelineHotCount > 0) return String(pipelineHotCount);
    if (item.count === "watchlist" && watchlistCount && watchlistCount > 0) return String(watchlistCount);
    return undefined;
  }

  function handleSearch() {
    if (isMobile) {
      onMobileClose?.();
      window.setTimeout(openSearch, 0);
      return;
    }
    openSearch();
  }

  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
    <aside
      ref={sidebarRef}
      id="workspace-navigation"
      className="sidebar"
      role={isMobile ? "dialog" : undefined}
      aria-modal={isMobile ? true : undefined}
      aria-label={isMobile ? "Workspace navigation" : undefined}
      aria-hidden={isMobile && !mobileOpen ? true : undefined}
      inert={isMobile && !mobileOpen}
      tabIndex={isMobile ? -1 : undefined}
    >
      <header className="sb-fixed-head">
        <div className="sb-head">
          <VesperWiseLogo className="ws-logo" size={24} />
          {!collapsed && (
            <div className="ws-name">
              {workspaceLabel}
              <span className="role">Workspace · {plan}</span>
            </div>
          )}
          {isMobile && (
            <button type="button" className="sb-mobile-close" onClick={onMobileClose} aria-label="Close navigation menu">
              <X aria-hidden />
            </button>
          )}
        </div>
        <Tooltip label="Search" visible={collapsed}>
          <button type="button" className="sb-search" onClick={handleSearch} aria-label="Search">
            <Search className="ic" aria-hidden />
            {!collapsed && <span>Search</span>}
            {!collapsed && <kbd className="kbd">⌘K</kbd>}
          </button>
        </Tooltip>
      </header>

      <nav className="sb-nav" aria-label="Primary navigation">
        {navigationGroups.map((group) => (
          <Fragment key={group.id}>
            <div className="sb-section">
              {!collapsed && <span>{group.label}</span>}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavigationItemActive(item, pathname);
              const displayCount = navCount(item);
              return (
                <Tooltip key={item.id} label={item.label} visible={collapsed}>
                  <Link
                    href={item.href}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn("sb-item", active && "active")}
                  >
                    <Icon className="ic" aria-hidden />
                    {!collapsed && (
                      <>
                        <span className="sb-item-label">{item.label}</span>
                        {item.badge && <span className="sb-beta">{item.badge}</span>}
                        {displayCount && <span className={cn("count", item.hotCount && "hot")}>{displayCount}</span>}
                      </>
                    )}
                  </Link>
                </Tooltip>
              );
            })}
          </Fragment>
        ))}
      </nav>

      <footer className="sb-footer">
        {!collapsed ? (
          <div className="sb-credits">
            <div className="label">Credits this month</div>
            <div className="row">
              <div>
                <span className="val">{creditsRemaining.toLocaleString()}</span>
                <span className="of"> / {creditCap.toLocaleString()}</span>
              </div>
              <Link href="/billing" className="topup">Top up</Link>
            </div>
            <div className="bar" role="progressbar" aria-label="Monthly credits remaining" aria-valuenow={creditPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="fill" style={{ width: `${creditPct}%` }} />
            </div>
          </div>
        ) : (
          <Tooltip label={`${creditsRemaining} credits`} visible>
            <Link href="/billing" className="sb-credit-compact" aria-label={`${creditsRemaining} credits remaining`}>{creditsRemaining}</Link>
          </Tooltip>
        )}

        <Tooltip label="Account" visible={collapsed}>
          <Link href="/settings" className="sb-user" aria-label="Account settings">
            <span className="av">{initials.slice(0, 2)}</span>
            {!collapsed && (
              <div className="info">
                <div className="name">{displayName}</div>
                <div className="email">{email}</div>
              </div>
            )}
          </Link>
        </Tooltip>

        <div className="sb-controls">
          {!isMobile && (
            <Tooltip label={collapsed ? "Expand" : "Collapse"} visible={collapsed}>
              <button
                type="button"
                onClick={onToggle}
                className="sb-control"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} aria-hidden />
              </button>
            </Tooltip>
          )}
          <Tooltip label="Theme" visible={collapsed}>
            <button type="button" onClick={toggleTheme} className="sb-control" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            </button>
          </Tooltip>
          <SignOutButton redirectUrl="/">
            <Tooltip label="Sign out" visible={collapsed}>
              <button type="button" className="sb-control sb-signout" aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          </SignOutButton>
        </div>
      </footer>
    </aside>
    </TooltipPrimitive.Provider>
  );
}
