"use client";

import Link from "next/link";
import type { WatchlistListTab } from "@/lib/watchlist-stats";

interface WatchlistListTabsProps {
  tabs: WatchlistListTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function WatchlistListTabs({ tabs, activeId, onChange }: WatchlistListTabsProps) {
  return (
    <div className="wl-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`wl-tab${activeId === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.id !== "all" && tab.color && (
            <span className="swatch" style={{ background: tab.color }} />
          )}
          {tab.name}
          <span className="pill">{tab.count}</span>
        </button>
      ))}
      <Link href="/lists" className="wl-tab" style={{ marginLeft: "auto", color: "var(--text-tertiary)" }}>
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="11" height="11" aria-hidden>
          <path d="M6 2v8M2 6h8" />
        </svg>
        New list
      </Link>
    </div>
  );
}
