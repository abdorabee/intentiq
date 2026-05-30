"use client";

import type { WatchlistAlertItem } from "@/lib/watchlist-stats";

interface WatchlistAlertStripProps {
  items: WatchlistAlertItem[];
  onDismiss: () => void;
  onReview: () => void;
}

export function WatchlistAlertStrip({ items, onDismiss, onReview }: WatchlistAlertStripProps) {
  if (items.length === 0) return null;

  const sub = items
    .map((i) => `${i.company_name} (▲ ${i.delta} to ${i.score})`)
    .join(" · ");

  return (
    <div className="alert-strip">
      <div className="icon">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" aria-hidden>
          <path d="M3 6a4 4 0 018 0v3l1 2H2l1-2V6z M5 11v1a2 2 0 004 0v-1" />
        </svg>
      </div>
      <div className="body">
        <div className="title">
          {items.length} account{items.length === 1 ? "" : "s"} crossed your HOT threshold recently
        </div>
        <div className="sub">{sub} — outreach window open</div>
      </div>
      <div className="actions">
        <button type="button" className="tb-btn outlined" onClick={onDismiss}>
          Dismiss
        </button>
        <button type="button" className="btn-primary" style={{ height: 30, padding: "0 12px" }} onClick={onReview}>
          Review now
        </button>
      </div>
    </div>
  );
}
