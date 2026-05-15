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

  const mainMargin = collapsed ? "lg:ml-16" : "lg:ml-[232px]";

  return (
    <>
      <DashboardNav
        creditsRemaining={creditsRemaining}
        plan={plan}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col bg-[#08090a] pt-14 transition-[margin] duration-300 ease-out lg:min-h-0 lg:pt-0 ${mainMargin}`}
      >
        <DashboardTopbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </>
  );
}
