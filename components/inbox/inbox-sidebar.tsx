"use client";

import { Inbox, Zap, TrendingUp, Radio, Star, Archive, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/lib/types";
import type { DbList } from "@/lib/lists-types";

type ViewFilter = "inbox" | "subscribed" | "read" | "snoozed";

interface InboxSidebarProps {
  notifications: InboxNotification[];
  lists: Pick<DbList, "id" | "name" | "color" | "icon_initials">[];
  activeView: ViewFilter;
  activeType: string | null;
  activeListId: string | null;
  onSelect: (view: ViewFilter, type: string | null, listId: string | null) => void;
}

export function InboxSidebar({
  notifications,
  lists,
  activeView,
  activeType,
  activeListId,
  onSelect,
}: InboxSidebarProps) {
  const unread = notifications.filter((n) => !n.is_read).length;
  const hotCount = notifications.filter((n) => n.tags.includes("HOT")).length;

  const byType = (type: string) => notifications.filter((n) => n.event_type === type).length;

  return (
    <div className="inbox-cats">
      <div className="cat-section">All</div>
      <button
        type="button"
        className={cn("cat-item", activeView === "inbox" && !activeType && !activeListId && "active")}
        onClick={() => onSelect("inbox", null, null)}
      >
        <Inbox className="ic" />
        Inbox
        {unread > 0 && <span className={cn("count", hotCount > 0 && "hot")}>{unread}</span>}
      </button>
      <button
        type="button"
        className={cn("cat-item", activeView === "subscribed" && !activeType && "active")}
        onClick={() => onSelect("subscribed", null, null)}
      >
        <Star className="ic" />
        All Activity
      </button>
      <button
        type="button"
        className={cn("cat-item", activeView === "snoozed" && "active")}
        onClick={() => onSelect("snoozed", null, null)}
      >
        <Clock className="ic" />
        Snoozed
      </button>
      <button
        type="button"
        className={cn("cat-item", activeView === "read" && "active")}
        onClick={() => onSelect("read", null, null)}
      >
        <Archive className="ic" />
        Read
      </button>

      <div className="cat-section" style={{ marginTop: 12 }}>By Type</div>
      <button
        type="button"
        className={cn("cat-item", activeType === "hot_crossing" && "active")}
        onClick={() => onSelect("subscribed", "hot_crossing", null)}
      >
        <span className="swatch" style={{ background: "var(--hot)" }} />
        HOT Crossings
        {byType("hot_crossing") > 0 && (
          <span className="count hot">{byType("hot_crossing")}</span>
        )}
      </button>
      <button
        type="button"
        className={cn("cat-item", activeType === "stage_change" && "active")}
        onClick={() => onSelect("subscribed", "stage_change", null)}
      >
        <TrendingUp className="ic" />
        Stage Changes
        {byType("stage_change") > 0 && (
          <span className="count">{byType("stage_change")}</span>
        )}
      </button>
      <button
        type="button"
        className={cn("cat-item", activeType === "autopilot_fire" && "active")}
        onClick={() => onSelect("subscribed", "autopilot_fire", null)}
      >
        <Zap className="ic" />
        Autopilot
        {byType("autopilot_fire") > 0 && (
          <span className="count">{byType("autopilot_fire")}</span>
        )}
      </button>
      <button
        type="button"
        className={cn("cat-item", activeType === "tech_signal" && "active")}
        onClick={() => onSelect("subscribed", "tech_signal", null)}
      >
        <Radio className="ic" />
        Tech Signals
        {byType("tech_signal") > 0 && (
          <span className="count">{byType("tech_signal")}</span>
        )}
      </button>

      {lists.length > 0 && (
        <>
          <div className="cat-section" style={{ marginTop: 12 }}>Lists</div>
          {lists.map((list) => {
            const count = notifications.filter((n) => n.list_id === list.id).length;
            return (
              <button
                key={list.id}
                type="button"
                className={cn("cat-item", activeListId === list.id && "active")}
                onClick={() => onSelect("subscribed", null, list.id)}
              >
                <span
                  className="swatch"
                  style={{ background: list.color || "var(--accent)" }}
                />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {list.name}
                </span>
                {count > 0 && <span className="count">{count}</span>}
              </button>
            );
          })}
        </>
      )}

      {lists.length === 0 && (
        <>
          <div className="cat-section" style={{ marginTop: 12 }}>Lists</div>
          <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--text-quaternary)" }}>
            No lists yet
          </div>
        </>
      )}
    </div>
  );
}
