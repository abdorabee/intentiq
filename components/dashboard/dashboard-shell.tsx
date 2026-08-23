"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardNav from "@/components/dashboard/nav";
import DashboardTopbar from "@/components/dashboard/dashboard-topbar";
import { ProductTourHost } from "@/components/dashboard/product-tour-host";
import { SearchProvider } from "@/components/dashboard/search-provider";
import { useTheme } from "@/components/theme-provider";
import type { DbUser } from "@/lib/types";
import type { TourProgress } from "@/lib/product-tour";
import {
  createPreferenceWriteCoordinator,
  patchUserPreferences,
  SIDEBAR_STORAGE_KEY,
  type ThemePreference,
  type PreferenceSaveStatus,
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
  initialTour?: TourProgress;
  activeTourVersion?: number;
}

interface DashboardShellContextValue {
  collapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  preferenceStatus: PreferenceSaveStatus;
}

const DashboardShellContext = createContext<DashboardShellContextValue | null>(null);

export function useDashboardShell(): DashboardShellContextValue {
  const context = useContext(DashboardShellContext);
  if (!context) throw new Error("useDashboardShell must be used inside DashboardShell");
  return context;
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
  initialTour,
  activeTourVersion,
}: DashboardShellProps) {
  const pathname = usePathname();
  const flushPages = ["/billing", "/inbox"];
  const pageClass = flushPages.includes(pathname) ? "page page-flush" : "page";
  const { reconcileTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(initialSidebarCollapsed ?? false);
  const collapsedRef = useRef(initialSidebarCollapsed ?? false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourTargetingNavigation, setTourTargetingNavigation] = useState(false);
  const [preferenceStatus, setPreferenceStatus] = useState<PreferenceSaveStatus>("idle");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const applySidebarPreference = useCallback((next: boolean) => {
    collapsedRef.current = next;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    document.documentElement.dataset.dashboardSidebar = next ? "collapsed" : "expanded";
  }, []);
  const [sidebarWriter] = useState(() => (
    createPreferenceWriteCoordinator<boolean>({
      initialValue: initialSidebarCollapsed ?? false,
      persist: (value) => patchUserPreferences({ sidebar_collapsed: value }),
      rollback: applySidebarPreference,
      onStatus: setPreferenceStatus,
    })
  ));

  // Reconcile the pre-paint local mirror with the authoritative server row.
  useLayoutEffect(() => {
    const collapsedPreference = initialSidebarCollapsed
      ?? localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    sidebarWriter.reconcile(collapsedPreference);
    applySidebarPreference(collapsedPreference);
    if (initialTheme) reconcileTheme(initialTheme);
  }, [applySidebarPreference, initialSidebarCollapsed, initialTheme, reconcileTheme, sidebarWriter]);

  // Track viewport — sidebar becomes off-canvas drawer on phones/tablets.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) {
        setMobileOpen(false);
        setTourTargetingNavigation(false);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Close the mobile drawer on route change.
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
      setTourTargetingNavigation(false);
    }
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
    if (tourTargetingNavigation) {
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
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
  }, [isMobile, mobileOpen, tourTargetingNavigation]);

  const setSidebarCollapsed = useCallback((next: boolean) => {
    if (collapsedRef.current === next) return;
    applySidebarPreference(next);
    sidebarWriter.request(next);
  }, [applySidebarPreference, sidebarWriter]);

  function toggle() {
    setSidebarCollapsed(!collapsedRef.current);
  }

  // On mobile the drawer always shows the full nav (ignore the desktop collapse state).
  const effectiveCollapsed = isMobile ? false : collapsed;
  const closeDrawerBeforeSearch = useCallback(() => {
    if (!isMobile || !mobileOpen) return false;
    setMobileOpen(false);
    setTourTargetingNavigation(false);
    return true;
  }, [isMobile, mobileOpen]);
  const openMobileNavigation = useCallback(() => {
    setTourTargetingNavigation(true);
    setMobileOpen(true);
  }, []);
  const closeMobileNavigation = useCallback(() => {
    setMobileOpen(false);
    setTourTargetingNavigation(false);
  }, []);
  const openRegularMobileNavigation = useCallback(() => {
    setTourTargetingNavigation(false);
    setMobileOpen(true);
  }, []);

  return (
    <DashboardShellContext.Provider value={{ collapsed, setSidebarCollapsed, preferenceStatus }}>
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
          tourTargeting={tourTargetingNavigation}
          onMobileClose={closeMobileNavigation}
          sidebarRef={sidebarRef}
        />
        <div
          className="dashboard-nav-backdrop"
          onClick={tourTargetingNavigation ? undefined : closeMobileNavigation}
          aria-hidden="true"
        />
        <div className="main">
          <DashboardTopbar
            onMenuClick={openRegularMobileNavigation}
            menuButtonRef={menuButtonRef}
            mobileMenuOpen={mobileOpen}
          />
          <main className={pageClass}>{children}</main>
        </div>
        {initialTour && (
          <ProductTourHost
            initial={initialTour}
            activeVersion={activeTourVersion}
            isMobile={isMobile}
            openMobileNavigation={openMobileNavigation}
            closeMobileNavigation={closeMobileNavigation}
          />
        )}
      </div>
    </SearchProvider>
    </DashboardShellContext.Provider>
  );
}
