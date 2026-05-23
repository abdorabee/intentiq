"use client";

import type { ListCardSummary } from "@/lib/lists-types";
import { deltaLabel } from "@/lib/lists-display";

interface ListCardProps {
  summary: ListCardSummary;
  onClick: () => void;
}

export function ListCard({ summary, onClick }: ListCardProps) {
  const { bandMix } = summary;
  const deltaClass = summary.weeklyDelta > 0 ? "" : summary.weeklyDelta < 0 ? "down" : "flat";

  return (
    <div className="list-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className="stripe" style={{ background: summary.color }} />
      <div className="list-card-head">
        <div className="lc-icon" style={{ background: `linear-gradient(135deg, ${summary.color}, ${summary.color}99)` }}>
          {summary.icon_initials}
        </div>
        <div className="lc-info">
          <div className="lc-title-row">
            <div className="lc-title">{summary.name}</div>
            <span className={`lc-tag ${summary.list_type}`}>
              {summary.list_type === "smart" ? (
                <>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" width="9" height="9">
                    <path d="M5 1v2M1 5h2M5 9v-2M9 5h-2M2 2l1 1M8 2l-1 1M2 8l1-1M8 8l-1-1" />
                  </svg>
                  Smart
                </>
              ) : (
                <>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" width="9" height="9">
                    <rect x="1.5" y="1.5" width="7" height="7" />
                  </svg>
                  Manual
                </>
              )}
            </span>
          </div>
          {summary.description && <div className="lc-desc">{summary.description}</div>}
        </div>
        <button
          type="button"
          className="lc-menu"
          onClick={(e) => e.stopPropagation()}
          aria-label="List options"
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
            <circle cx="3" cy="6" r="1" /><circle cx="6" cy="6" r="1" /><circle cx="9" cy="6" r="1" />
          </svg>
        </button>
      </div>
      <div className="list-card-mid">
        <div className="lc-count">
          <div className="n">{summary.accountCount}</div>
          <div className="l">Accounts</div>
          <div className={`delta ${deltaClass}`}>{deltaLabel(summary.weeklyDelta)}</div>
        </div>
        <div className="lc-spark">
          {summary.sparkline.map((h, i) => (
            <div
              key={i}
              className="b"
              style={{
                height: `${Math.max(h, 4)}%`,
                background: i === summary.sparkline.length - 1 ? summary.color : undefined,
              }}
            />
          ))}
        </div>
      </div>
      <div className="lc-mixbar">
        <div className="seg" style={{ background: "var(--hot)", flex: bandMix.hot }} />
        <div className="seg" style={{ background: "var(--warm)", flex: bandMix.warm }} />
        <div className="seg" style={{ background: "var(--cold)", opacity: 0.7, flex: bandMix.cold }} />
      </div>
      <div className="lc-mixbar-leg">
        <span><span className="sw" style={{ background: "var(--hot)" }} />HOT {bandMix.hot}</span>
        <span><span className="sw" style={{ background: "var(--warm)" }} />WARM {bandMix.warm}</span>
        <span><span className="sw" style={{ background: "var(--cold)", opacity: 0.7 }} />COLD {bandMix.cold}</span>
        <span style={{ marginLeft: "auto" }}>avg {summary.avgScore || "—"}</span>
      </div>
      <div className="list-card-foot">
        <div className="lc-avs">
          {summary.avatarInitials.map((init, i) => (
            <div key={i} className={`av ${summary.avatarClasses[i]}`}>{init}</div>
          ))}
          {summary.accountCount > summary.avatarInitials.length && (
            <span className="more">+{summary.accountCount - summary.avatarInitials.length}</span>
          )}
        </div>
        <div className={`lc-last${summary.isRecentlyActive ? "" : " cool"}`}>
          <span className="pulse" />
          {summary.lastUpdatedLabel}
        </div>
      </div>
    </div>
  );
}
