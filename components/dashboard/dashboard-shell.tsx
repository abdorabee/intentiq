"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardNav from "@/components/dashboard/nav";
import DashboardTopbar from "@/components/dashboard/dashboard-topbar";
import { SearchProvider } from "@/components/dashboard/search-provider";
import type { DbUser } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
  creditsRemaining: number;
  plan: DbUser["plan"];
  inboxCount?: number;
}

export default function DashboardShell({ children, creditsRemaining, plan, inboxCount }: DashboardShellProps) {
  const pathname = usePathname();
  const flushPages = ["/billing", "/inbox"];
  const pageClass = flushPages.includes(pathname) ? "page page-flush" : "page";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nav-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("nav-collapsed", String(!prev));
      return !prev;
    });
  }

  return (
    <SearchProvider>
      <div
        className="app"
        style={{ gridTemplateColumns: collapsed ? "56px 1fr" : "232px 1fr" }}
      >
        <DashboardNav
          creditsRemaining={creditsRemaining}
          plan={plan}
          collapsed={collapsed}
          onToggle={toggle}
          inboxCount={inboxCount}
        />
        <div className="main">
          <DashboardTopbar />
          <main className={pageClass}>{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
}
