"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PLAN_CREDITS, type DbUser } from "@/lib/types";
import { getWorkspaceLabel } from "@/lib/workspace-label";
import {
  LayoutGrid,
  Flame,
  Gauge,
  History,
  UserSearch,
  Eye,
  ListChecks,
  Upload,
  Zap,
  Inbox,
  CreditCard,
  Key,
  LogOut,
  Sun,
  Moon,
  PanelLeft,
  Search,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useDashboardSearch } from "@/components/dashboard/search-provider";
import VesperWiseLogo from "@/components/vesperwise-logo";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  indicator?: boolean;
  hotCount?: boolean;
  beta?: boolean;
  comingSoon?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const WORKSPACE_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/score", label: "Score", icon: Gauge },
      { href: "/pipeline", label: "Intent Hub", icon: Flame, hotCount: true },
    ],
  },
  {
    label: "Accounts",
    items: [
      { href: "/watchlist", label: "Watchlist", icon: Eye },
      { href: "/lists", label: "Lists", icon: ListChecks },
      { href: "/people", label: "People", icon: UserSearch, beta: true },
      { href: "/history", label: "History", icon: History },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/bulk", label: "Bulk Score", icon: Upload },
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/autopilot", label: "Autopilot", icon: Zap, comingSoon: true },
    ],
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/api-keys", label: "API Keys", icon: Key, comingSoon: true },
];

interface DashboardNavProps {
  creditsRemaining?: number;
  plan: DbUser["plan"];
  collapsed?: boolean;
  onToggle?: () => void;
  inboxCount?: number;
  watchlistCount?: number;
  pipelineHotCount?: number;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export default function DashboardNav({
  creditsRemaining = 0,
  plan,
  collapsed = false,
  onToggle,
  inboxCount,
  watchlistCount,
  pipelineHotCount,
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

  function navCount(item: NavItem): string | undefined {
    if (item.href === "/inbox" && inboxCount && inboxCount > 0) return String(inboxCount);
    if (item.href === "/pipeline" && pipelineHotCount && pipelineHotCount > 0) return String(pipelineHotCount);
    if (item.href === "/watchlist" && watchlistCount && watchlistCount > 0) return String(watchlistCount);
    return undefined;
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = isActivePath(pathname, item.href);
    const displayCount = navCount(item);
    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn("sb-item", active && "active")}
        data-tour={
          item.href === "/pipeline" ? "nav-intent-hub" : item.href === "/settings" ? "nav-settings" : undefined
        }
      >
        <Icon className="ic" />
        {!collapsed && (
          <>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
            {item.comingSoon && (
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-quaternary)" }}>
                Soon
              </span>
            )}
            {item.beta && !item.comingSoon && (
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--accent-2)" }}>
                Beta
              </span>
            )}
            {displayCount && (
              <span className={cn("count", item.hotCount && "hot")}>{displayCount}</span>
            )}
            {item.indicator && <span className="indicator" />}
          </>
        )}
      </Link>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <VesperWiseLogo className="ws-logo" size={24} />
        {!collapsed && (
          <div className="ws-name">
            {workspaceLabel}
            <span className="role">Workspace · {plan}</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <button type="button" className="sb-search" onClick={openSearch} aria-label="Search">
          <Search className="ic" />
          <span>Search</span>
          <kbd className="kbd">⌘K</kbd>
        </button>
      )}

      {WORKSPACE_SECTIONS.map((section) => (
        <Fragment key={section.label}>
          {!collapsed && (
            <div className="sb-section">
              <span>{section.label}</span>
            </div>
          )}
          {section.items.map(renderItem)}
        </Fragment>
      ))}

      <div className="sb-divider" />

      {!collapsed && (
        <div className="sb-section">
          <span>Account</span>
        </div>
      )}
      {ACCOUNT_ITEMS.map(renderItem)}

      <div className="sb-spacer" />

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
          <div className="bar">
            <div className="fill" style={{ width: `${creditPct}%` }} />
          </div>
        </div>
      ) : (
        <div
          title={`${creditsRemaining} credits`}
          style={{ margin: "8px 4px", padding: "8px 4px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}
        >
          {creditsRemaining}
        </div>
      )}

      <UserAccountMenu
        collapsed={collapsed}
        displayName={displayName}
        email={email}
        initials={initials.slice(0, 2)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 4px 0" }}>
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: "var(--r-sm)", color: "var(--text-tertiary)", cursor: "pointer" }}
          className="hover:bg-foreground/[0.05] hover:text-[var(--text-primary)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}

function UserAccountMenu({
  collapsed,
  displayName,
  email,
  initials,
  theme,
  onToggleTheme,
}: {
  collapsed: boolean;
  displayName: string;
  email: string;
  initials: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  function placeMenu() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = collapsed ? 208 : Math.max(rect.width, 200);
    const estimatedHeight = 148;
    if (collapsed) {
      const top = Math.min(rect.top, window.innerHeight - estimatedHeight - 8);
      setCoords({ top, left: rect.right + 8, width });
      return;
    }
    const top = Math.max(8, rect.top - estimatedHeight - 6);
    setCoords({ top, left: rect.left, width });
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onReposition() {
      placeMenu();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, collapsed]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sb-user-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="sb-user"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Open account menu"
        onClick={() => {
          setOpen((current) => {
            if (!current) placeMenu();
            return !current;
          });
        }}
      >
        <span className="av">{initials}</span>
        {!collapsed && (
          <div className="info">
            <div className="name">{displayName}</div>
            <div className="email">{email}</div>
          </div>
        )}
        {!collapsed && <ChevronDown className="sb-user-chev" aria-hidden />}
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="sb-user-menu"
              style={{ top: coords.top, left: coords.left, width: coords.width }}
            >
              <Link
                href="/settings"
                className="sb-user-menu-item"
                onClick={() => setOpen(false)}
              >
                <Settings className="ic" />
                Settings
              </Link>
              <button
                type="button"
                className="sb-user-menu-item"
                onClick={() => {
                  onToggleTheme();
                }}
              >
                {theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}
                <span style={{ flex: 1 }}>Appearance</span>
                <span className="sb-user-menu-meta">{theme === "dark" ? "Dark" : "Light"}</span>
              </button>
              <SignOutButton redirectUrl="/">
                <button type="button" className="sb-user-menu-item danger">
                  <LogOut className="ic" />
                  Sign out
                </button>
              </SignOutButton>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
