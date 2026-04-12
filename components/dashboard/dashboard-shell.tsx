"use client";

import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/nav";

interface DashboardShellProps {
  children: React.ReactNode;
  creditsRemaining: number;
}

export default function DashboardShell({ children, creditsRemaining }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state across navigation
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

  const navWidth = collapsed ? "lg:ml-16" : "lg:ml-60";

  return (
    <>
      <DashboardNav
        creditsRemaining={creditsRemaining}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <main
        className={`flex-1 w-full p-4 pt-16 lg:p-10 lg:pt-10 transition-[margin] duration-300 ease-out ${navWidth}`}
      >
        {children}
      </main>
    </>
  );
}
