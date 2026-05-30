"use client";

import { useState, useCallback } from "react";
import type { InboxNotification } from "@/lib/types";
import type { DbList } from "@/lib/lists-types";
import { InboxSidebar } from "@/components/inbox/inbox-sidebar";
import { InboxList } from "@/components/inbox/inbox-list";
import { InboxDetail } from "@/components/inbox/inbox-detail";

type ViewFilter = "inbox" | "subscribed" | "read" | "snoozed";

interface InboxViewProps {
  initialNotifications: InboxNotification[];
  lists: Pick<DbList, "id" | "name" | "color" | "icon_initials">[];
}

export function InboxView({ initialNotifications, lists }: InboxViewProps) {
  const [notifications, setNotifications] = useState<InboxNotification[]>(initialNotifications);
  const [selectedId, setSelectedId] = useState<string | null>(initialNotifications[0]?.id ?? null);
  const [activeView, setActiveView] = useState<ViewFilter>("inbox");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = notifications.find((n) => n.id === selectedId) ?? null;

  const fetchNotifications = useCallback(
    async (view: ViewFilter, type: string | null, listId: string | null) => {
      setLoading(true);
      const params = new URLSearchParams({ view });
      if (type) params.set("type", type);
      if (listId) params.set("list_id", listId);
      try {
        const res = await fetch(`/api/inbox?${params}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
          setSelectedId(data.notifications?.[0]?.id ?? null);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function handleFilterChange(view: ViewFilter, type: string | null, listId: string | null) {
    setActiveView(view);
    setActiveType(type);
    setActiveListId(listId);
    fetchNotifications(view, type, listId);
  }

  function updateNotification(id: string, patch: Partial<InboxNotification>) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function removeNotification(id: string) {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  async function patchNotification(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function handleMarkRead(id: string) {
    const ok = await patchNotification(id, { is_read: true });
    if (ok) updateNotification(id, { is_read: true });
  }

  async function handleMarkUnread(id: string) {
    const ok = await patchNotification(id, { is_read: false });
    if (ok) updateNotification(id, { is_read: false });
  }

  async function handleSnooze(id: string) {
    const snoozed_until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const ok = await patchNotification(id, { is_snoozed: true, snoozed_until });
    if (ok) removeNotification(id);
  }

  async function handleArchive(id: string) {
    const ok = await patchNotification(id, { is_archived: true });
    if (ok) removeNotification(id);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="inbox-shell">
      <InboxSidebar
        notifications={notifications}
        lists={lists}
        activeView={activeView}
        activeType={activeType}
        activeListId={activeListId}
        onSelect={handleFilterChange}
      />
      <InboxList
        notifications={notifications}
        selectedId={selectedId}
        loading={loading}
        unreadCount={unreadCount}
        activeView={activeView}
        onSelect={(id) => {
          setSelectedId(id);
          const n = notifications.find((x) => x.id === id);
          if (n && !n.is_read) handleMarkRead(id);
        }}
        onMarkRead={handleMarkRead}
        onArchive={handleArchive}
      />
      <InboxDetail
        notification={selected}
        onMarkRead={handleMarkRead}
        onMarkUnread={handleMarkUnread}
        onSnooze={handleSnooze}
        onArchive={handleArchive}
      />
    </div>
  );
}
