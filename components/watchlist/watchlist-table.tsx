"use client";

import { useRouter } from "next/navigation";
import {
  bandColor,
  getAvatarClass,
  getAvatarInitial,
  sparklineForRange,
  type WatchlistEnrichedEntry,
  type WatchlistRange,
} from "@/lib/watchlist-stats";

interface WatchlistTableProps {
  rows: WatchlistEnrichedEntry[];
  range: WatchlistRange;
  selected: Set<string>;
  onToggleSelect: (domain: string) => void;
  onRemove: (domain: string) => void;
  removing: string | null;
  showAll: boolean;
  onShowAll: () => void;
}

const PAGE_SIZE = 12;

export function WatchlistTable({
  rows,
  range,
  selected,
  onToggleSelect,
  onRemove,
  removing,
  showAll,
  onShowAll,
}: WatchlistTableProps) {
  const router = useRouter();
  const visible = showAll ? rows : rows.slice(0, PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="wl-table">
        <div className="wl-foot">
          <span className="left">No accounts on your watchlist</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-table">
      <div className="wl-head">
        <div />
        <div>Account</div>
        <div style={{ textAlign: "left" }}>Score</div>
        <div>7d trend</div>
        <div>Signal mix</div>
        <div>Threshold</div>
        <div>Last move</div>
        <div />
      </div>

      {visible.map((row) => {
        const scoreColor = bandColor(row.score_band);
        const sparkline = sparklineForRange(row.scoreHistory, range);
        const maxSpark = Math.max(...sparkline, 1);
        const isChecked = selected.has(row.domain);

        return (
          <div
            key={row.id}
            className="wl-row"
            onClick={() => router.push(`/score?domain=${encodeURIComponent(row.domain)}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(`/score?domain=${encodeURIComponent(row.domain)}`);
            }}
          >
            <div
              className={`checkbox${isChecked ? " checked" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(row.domain);
              }}
              role="checkbox"
              aria-checked={isChecked}
            >
              {isChecked && (
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" width="8" height="8" aria-hidden>
                  <path d="M2 5l2 2 4-4" />
                </svg>
              )}
            </div>

            <div className="wl-co">
              <div className={getAvatarClass(row.company_name)}>{getAvatarInitial(row.company_name)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="name">{row.company_name}</div>
                <div className="domain">{row.domain}</div>
              </div>
            </div>

            <div className="wl-score-cell" style={{ color: scoreColor }}>
              {row.score ?? "—"}
            </div>

            <div className="wl-spark">
              {sparkline.map((val, i) => {
                const isCur = i === sparkline.length - 1;
                const h = Math.max(8, Math.round((val / maxSpark) * 100));
                return (
                  <div
                    key={i}
                    className={`b${isCur ? " cur" : ""}`}
                    style={{
                      height: `${h}%`,
                      ...(isCur ? { background: scoreColor } : {}),
                    }}
                  />
                );
              })}
            </div>

            <div className="wl-mix">
              {row.signalMix.map((seg) => (
                <div
                  key={seg.key}
                  className="seg"
                  style={{ background: seg.color, height: `${seg.heightPct}%` }}
                />
              ))}
            </div>

            <div>
              <div className="wl-threshold">
                {row.thresholdHit ? (
                  <span className="hit">{row.thresholdLabel}</span>
                ) : (
                  row.thresholdLabel
                )}
              </div>
              <div className="threshold-bar" style={{ marginTop: 6 }}>
                <div
                  className="fill"
                  style={{
                    width: `${Math.min(100, row.score ?? 0)}%`,
                    background: scoreColor,
                  }}
                />
                <div className="marker" style={{ left: "75%" }} />
              </div>
            </div>

            <div className="mono" style={{ color: row.lastMoveColor, fontSize: 12 }}>
              {row.lastMoveLabel}
            </div>

            <div className="wl-actions">
              <button
                type="button"
                className="wl-icon-btn"
                aria-label="Favorite"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11" aria-hidden>
                  <path d="M6 1l1.5 3.5L11 5l-3 2 1 4-3-2-3 2 1-4-3-2L4.5 4.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="wl-icon-btn"
                aria-label={`Remove ${row.company_name}`}
                disabled={removing === row.domain}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(row.domain);
                }}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11" aria-hidden>
                  <circle cx="3" cy="6" r="1" />
                  <circle cx="6" cy="6" r="1" />
                  <circle cx="9" cy="6" r="1" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      <div className="wl-foot">
        <span className="left">
          {visible.length} of {rows.length} visible · sorted by score ↓
        </span>
        {!showAll && rows.length > PAGE_SIZE && (
          <button
            type="button"
            onClick={onShowAll}
            style={{
              color: "var(--text-secondary)",
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            Show all {rows.length} →
          </button>
        )}
      </div>
    </div>
  );
}
