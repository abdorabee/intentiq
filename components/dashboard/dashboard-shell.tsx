"use client";

import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/nav";
import DashboardTopbar from "@/components/dashboard/dashboard-topbar";
import type { DbUser } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
  creditsRemaining: number;
  plan: DbUser["plan"];
}

export default function DashboardShell({ children, creditsRemaining, plan }: DashboardShellProps) {
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
    <div
      className="app"
      style={{ gridTemplateColumns: collapsed ? "56px 1fr" : "232px 1fr" }}
    >
      <DashboardNav
        creditsRemaining={creditsRemaining}
        plan={plan}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div className="main">
        <DashboardTopbar />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
