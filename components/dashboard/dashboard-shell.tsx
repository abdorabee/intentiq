"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardNav from "@/components/dashboard/nav";
import DashboardTopbar from "@/components/dashboard/dashboard-topbar";
import { SearchProvider } from "@/components/dashboard/search-provider";
import { useTheme } from "@/components/theme-provider";
import type { DbUser } from "@/lib/types";
import {
  patchUserPreferences,
  SIDEBAR_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/user-preferences";

interface DashboardShellProps {
  children: React.ReactNode;
  creditsRemaining: number;
  plan: DbUser["plan"];
  inboxCount?: number;
  watchlistCount?: number;
  pipelineHotCount?: number;
  initialSidebarCollapsed?: boolean;
  initialTheme?: ThemePreference;
}

export default function DashboardShell({
  children,
  creditsRemaining,
  plan,
  inboxCount,
  watchlistCount,
  pipelineHotCount,
  initialSidebarCollapsed,
  initialTheme,
}: DashboardShellProps) {
  const pathname = usePathname();
  const flushPages = ["/billing", "/inbox"];
  const pageClass = flushPages.includes(pathname) ? "page page-flush" : "page";
  const { reconcileTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(initialSidebarCollapsed ?? false);
  const collapsedRef = useRef(initialSidebarCollapsed ?? false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const applySidebarPreference = useCallback((next: boolean) => {
    collapsedRef.current = next;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    document.documentElement.dataset.dashboardSidebar = next ? "collapsed" : "expanded";
  }, []);

  // Reconcile the pre-paint local mirror with the authoritative server row.
  useLayoutEffect(() => {
    const collapsedPreference = initialSidebarCollapsed
      ?? localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    applySidebarPreference(collapsedPreference);
    if (initialTheme) reconcileTheme(initialTheme);
  }, [applySidebarPreference, initialSidebarCollapsed, initialTheme, reconcileTheme]);

  // Track viewport — sidebar becomes off-canvas drawer on phones/tablets.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMobileOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Close the mobile drawer on route change.
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;

    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;
    const navigationPanel: HTMLElement = sidebarElement;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : menuButtonRef.current;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    document.body.style.overflow = "hidden";
    const focusables = Array.from(navigationPanel.querySelectorAll<HTMLElement>(focusableSelector));
    focusables[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const currentFocusable = Array.from(
        navigationPanel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (currentFocusable.length === 0) {
        event.preventDefault();
        navigationPanel.focus();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isMobile, mobileOpen]);

  function toggle() {
    const previous = collapsedRef.current;
    const next = !previous;
    applySidebarPreference(next);
    void patchUserPreferences({ sidebar_collapsed: next }).catch(() => {
      if (collapsedRef.current === next) applySidebarPreference(previous);
    });
  }

  // On mobile the drawer always shows the full nav (ignore the desktop collapse state).
  const effectiveCollapsed = isMobile ? false : collapsed;
  const closeDrawerBeforeSearch = useCallback(() => {
    if (!isMobile || !mobileOpen) return false;
    setMobileOpen(false);
    return true;
  }, [isMobile, mobileOpen]);

  return (
    <SearchProvider beforeOpen={closeDrawerBeforeSearch}>
      <div
        className={`dashboard-shell${effectiveCollapsed ? " is-collapsed" : ""}${mobileOpen ? " nav-open" : ""}`}
      >
        <DashboardNav
          creditsRemaining={creditsRemaining}
          plan={plan}
          collapsed={effectiveCollapsed}
          onToggle={toggle}
          inboxCount={inboxCount}
          watchlistCount={watchlistCount}
          pipelineHotCount={pipelineHotCount}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          sidebarRef={sidebarRef}
        />
        <div
          className="dashboard-nav-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div className="main">
          <DashboardTopbar
            onMenuClick={() => setMobileOpen(true)}
            menuButtonRef={menuButtonRef}
            mobileMenuOpen={mobileOpen}
          />
          <main className={pageClass}>{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
}
