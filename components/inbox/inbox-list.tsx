"use client";

import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Filter } from "lucide-react";

type ViewFilter = "inbox" | "subscribed" | "read" | "snoozed";

const VIEW_LABELS: Record<ViewFilter, string> = {
  inbox: "Inbox",
  subscribed: "All Activity",
  read: "Read",
  snoozed: "Snoozed",
};

interface InboxListProps {
  notifications: InboxNotification[];
  selectedId: string | null;
  loading: boolean;
  unreadCount: number;
  activeView: ViewFilter;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}

function tagClass(tag: string) {
  if (tag === "HOT") return "tag hot";
  if (tag === "funding" || tag === "news") return "tag blue";
  if (tag === "WARM" || tag === "hiring") return "tag warm";
  return "tag";
}

export function InboxList({
  notifications,
  selectedId,
  loading,
  unreadCount,
  activeView,
  onSelect,
}: InboxListProps) {
  return (
    <div className="msg-list-pane">
      <div className="mlp-head">
        <span className="title">{VIEW_LABELS[activeView]}</span>
        {unreadCount > 0 && <span className="count-pill">{unreadCount}</span>}
        <div className="mlp-actions">
          <button type="button" className="tb-btn" title="Refresh" disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button type="button" className="tb-btn" title="Filter">
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mlp-tabs">
        <button type="button" className="mlp-tab active">All</button>
        <button type="button" className="mlp-tab">Mentions</button>
        <button type="button" className="mlp-tab">Activity</button>
      </div>

      <div className="msg-list">
        {notifications.length === 0 ? (
          <div className="inbox-empty">
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>All caught up</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              {activeView === "inbox"
                ? "No new notifications"
                : "Nothing here yet"}
            </div>
          </div>
        ) : (
          notifications.map((n) => {
            const hotTag = n.tags.includes("HOT");
            const relTime = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
            const visibleTags = n.tags.slice(0, 3);
            return (
              <div
                key={n.id}
                className={cn(
                  "msg-row",
                  n.id === selectedId && "selected",
                  !n.is_read && "unread"
                )}
                onClick={() => onSelect(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSelect(n.id)}
              >
                <span
                  className="indicator"
                  style={hotTag ? { background: "var(--hot)" } : undefined}
                />
                <div className="body">
                  <div className="top">
                    <span className="subj">{n.company_name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-quaternary)", flexShrink: 0 }}>
                      {relTime}
                    </span>
                  </div>
                  <div className="preview">{n.title}</div>
                  <div className="tags">
                    {visibleTags.map((tag) => (
                      <span key={tag} className={tagClass(tag)}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
