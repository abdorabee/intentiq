"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardSearch } from "@/components/dashboard/search-provider";
import { focusWatchlistAdd } from "@/lib/watchlist-events";
import { getNavigationBreadcrumb } from "@/lib/dashboard-search";

interface BandCounts {
  hot: number;
  warm: number;
  cold: number;
}

interface DashboardTopbarProps {
  bandCounts?: BandCounts;
  onMenuClick?: () => void;
}

export default function DashboardTopbar({ bandCounts, onMenuClick }: DashboardTopbarProps) {
  const pathname = usePathname();
  const isLists = pathname === "/lists" || pathname.startsWith("/lists/");
  const isBilling = pathname === "/billing";
  const isWatchlist = pathname === "/watchlist";
  const listDetailMatch = pathname.match(/^\/lists\/([^/]+)$/);
  const listDetailId = listDetailMatch?.[1] ?? null;
  const [listCrumb, setListCrumb] = useState<{ id: string; name: string | null } | null>(null);
  const { open: openSearch } = useDashboardSearch();

  useEffect(() => {
    if (!listDetailId) return;

    fetch(`/api/dashboard/lists/${listDetailId}`)
      .then((r) => r.json())
      .then((d) => setListCrumb({ id: listDetailId, name: d.list?.name ?? null }))
      .catch(() => setListCrumb({ id: listDetailId, name: null }));
  }, [listDetailId]);

  const crumb = getNavigationBreadcrumb(pathname);
  const CrumbIcon = crumb.icon;
  const listName = listCrumb?.id === listDetailId ? listCrumb.name : null;

  const hot = bandCounts?.hot ?? 0;
  const warm = bandCounts?.warm ?? 0;
  const cold = bandCounts?.cold ?? 0;

  function openNewListModal() {
    window.dispatchEvent(new Event("lists-open-modal"));
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="tb-menu"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="ic" aria-hidden />
      </button>
      <div className="crumb">
        <CrumbIcon className="ic" aria-hidden />
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
      ) : null}
    </header>
  );
}
