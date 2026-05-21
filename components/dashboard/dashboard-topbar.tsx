"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, Filter, Bell, Plus } from "lucide-react";

const CRUMB: Record<string, { parent: string; current: string }> = {
  "/dashboard": { parent: "Workspace", current: "Dashboard" },
  "/analyze": { parent: "Workspace", current: "Analyze" },
  "/memory": { parent: "Workspace", current: "Memory" },
  "/pipeline": { parent: "Workspace", current: "Intent Hub" },
  "/people": { parent: "Workspace", current: "People" },
  "/history": { parent: "Workspace", current: "History" },
  "/watchlist": { parent: "Workspace", current: "Watchlist" },
  "/autopilot": { parent: "Workspace", current: "Autopilot" },
  "/bulk": { parent: "Workspace", current: "Bulk" },
  "/billing": { parent: "Workspace", current: "Billing" },
  "/api-keys": { parent: "Workspace", current: "API Keys" },
  "/score": { parent: "Workspace", current: "Score" },
  "/settings": { parent: "Workspace", current: "Settings" },
};

interface BandCounts {
  hot: number;
  warm: number;
  cold: number;
}

interface DashboardTopbarProps {
  bandCounts?: BandCounts;
}

export default function DashboardTopbar({ bandCounts }: DashboardTopbarProps) {
  const pathname = usePathname();
  const crumb = CRUMB[pathname] ?? { parent: "Workspace", current: "IntentIQ" };
  const hot = bandCounts?.hot ?? 0;
  const warm = bandCounts?.warm ?? 0;
  const cold = bandCounts?.cold ?? 0;

  return (
    <header className="topbar">
      <div className="crumb">
        <LayoutGrid className="ic" aria-hidden />
        <span>{crumb.parent}</span>
        <span className="sep">/</span>
        <span className="current">{crumb.current}</span>
      </div>

      <span className="band band-hot">
        <span className="dot" />
        HOT {hot}
      </span>
      <span className="band band-warm">
        <span className="dot" />
        WARM {warm}
      </span>
      <span className="band band-cold">
        <span className="dot" />
        COLD {cold}
      </span>

      <span className="spacer" />

      <button type="button" className="tb-btn">
        <Search className="ic" aria-hidden />
        Search
        <kbd className="kbd">⌘K</kbd>
      </button>
      <button type="button" className="tb-btn outlined">
        <Filter className="ic" aria-hidden />
        Filter
      </button>
      <button
        type="button"
        className="notif"
        aria-label="Notifications"
      >
        <Bell style={{ width: 14, height: 14 }} />
        <span className="dot" />
      </button>
      <Link href="/score" className="btn-primary">
        <Plus className="ic" style={{ strokeWidth: 2.2 }} />
        Score account
      </Link>
    </header>
  );
}
