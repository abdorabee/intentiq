"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, Filter, Bell, Plus, List, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardSearch } from "@/components/dashboard/search-provider";
import { focusWatchlistAdd } from "@/lib/watchlist-events";

const CRUMB: Record<string, { parent: string; current: string }> = {
  "/dashboard": { parent: "Workspace", current: "Dashboard" },
  "/memory": { parent: "Workspace", current: "Memory" },
  "/pipeline": { parent: "Workspace", current: "Intent Hub" },
  "/people": { parent: "Workspace", current: "People" },
  "/history": { parent: "Workspace", current: "History" },
  "/watchlist": { parent: "Workspace", current: "Watchlist" },
  "/lists": { parent: "Workspace", current: "Lists" },
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
  const isLists = pathname === "/lists" || pathname.startsWith("/lists/");
  const isBilling = pathname === "/billing";
  const isWatchlist = pathname === "/watchlist";
  const listDetailMatch = pathname.match(/^\/lists\/([^/]+)$/);
  const [listName, setListName] = useState<string | null>(null);
  const { open: openSearch } = useDashboardSearch();

  useEffect(() => {
    if (!listDetailMatch) {
      setListName(null);
      return;
    }
    const id = listDetailMatch[1];
    fetch(`/api/dashboard/lists/${id}`)
      .then((r) => r.json())
      .then((d) => setListName(d.list?.name ?? null))
      .catch(() => setListName(null));
  }, [listDetailMatch?.[1]]);

  const crumb = CRUMB[pathname] ?? (
    listDetailMatch
      ? { parent: "Lists", current: listName ?? "List detail" }
      : { parent: "Workspace", current: "IntentIQ" }
  );

  const hot = bandCounts?.hot ?? 0;
  const warm = bandCounts?.warm ?? 0;
  const cold = bandCounts?.cold ?? 0;

  function openNewListModal() {
    window.dispatchEvent(new Event("lists-open-modal"));
  }

  return (
    <header className="topbar">
      <div className="crumb">
        {isLists ? (
          <List className="ic" aria-hidden />
        ) : isBilling ? (
          <CreditCard className="ic" aria-hidden />
        ) : (
          <LayoutGrid className="ic" aria-hidden />
        )}
        <span>{crumb.parent}</span>
        <span className="sep">/</span>
        {listDetailMatch ? (
          <>
            <Link href="/lists" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>Lists</Link>
            <span className="sep">/</span>
            <span className="current">{listName ?? "…"}</span>
          </>
        ) : (
          <span className="current">{crumb.current}</span>
        )}
      </div>

      {!isLists && !isBilling && (
        <>
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
        </>
      )}

      <span className="spacer" />

      <button type="button" className="tb-btn" onClick={openSearch} aria-label="Search">
        <Search className="ic" aria-hidden />
        Search
        <kbd className="kbd">⌘K</kbd>
      </button>
      {!isLists && !isBilling && (
        <button type="button" className="tb-btn outlined">
          <Filter className="ic" aria-hidden />
          Filter
        </button>
      )}
      <button type="button" className="notif" aria-label="Notifications">
        <Bell style={{ width: 14, height: 14 }} />
        <span className="dot" />
      </button>
      {isLists ? (
        <button type="button" className="btn-primary" onClick={openNewListModal}>
          <Plus className="ic" style={{ strokeWidth: 2.2 }} />
          New list
        </button>
      ) : isBilling ? (
        <button type="button" className="tb-btn outlined">
          Export
        </button>
      ) : isWatchlist ? (
        <button type="button" className="btn-primary" onClick={focusWatchlistAdd}>
          <Plus className="ic" style={{ strokeWidth: 2.2 }} />
          Add to watchlist
        </button>
      ) : (
        <Link href="/score" className="btn-primary">
          <Plus className="ic" style={{ strokeWidth: 2.2 }} />
          Score account
        </Link>
      )}
    </header>
  );
}
