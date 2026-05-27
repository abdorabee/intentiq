"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/lib/types";
import { Mail, Archive, Clock, MoreHorizontal, ExternalLink, Users } from "lucide-react";

interface InboxDetailProps {
  notification: InboxNotification | null;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onSnooze: (id: string) => void;
  onArchive: (id: string) => void;
}

function ScoreDelta({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: "var(--text-quaternary)" }}>—</span>;
  const color = value > 0 ? "var(--hot)" : "var(--text-tertiary)";
  return <span style={{ color }}>{value > 0 ? `+${value}` : value}</span>;
}

function EventCard({ n }: { notification?: never; n: InboxNotification }) {
  const meta = n.metadata;
  const deltas = (meta.signal_deltas as Record<string, number>) ?? {};
  const band = (meta.score_band as string) ?? n.tags[0] ?? "";
  const scoreAfter = (meta.score_after as number) ?? 0;

  return (
    <div className="event-card">
      <div className="event-card-head">
        <span
          className={cn(
            "ic",
            band === "HOT" ? "hot" : band === "WARM" ? "warm" : "blue"
          )}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            background:
              band === "HOT"
                ? "rgba(74,222,128,0.12)"
                : band === "WARM"
                ? "rgba(245,181,68,0.12)"
                : "rgba(78,201,216,0.12)",
            color:
              band === "HOT"
                ? "var(--hot)"
                : band === "WARM"
                ? "var(--warm)"
                : "var(--cyan)",
          }}
        >
          {band === "HOT" ? "🔥" : band === "WARM" ? "📈" : "📊"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
            {n.event_type === "hot_crossing" ? "HOT Threshold Crossed" : "Score Change Detected"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
            Intent signals triggered this alert
          </div>
        </div>
        <span className={cn("band", `band-${band.toLowerCase()}`)}>
          {band}
        </span>
      </div>

      <div className="event-rows">
        <div className="event-stat">
          <div className="lab">Score</div>
          <div className="val">{scoreAfter ?? "—"}</div>
          <div className="delta"><ScoreDelta value={typeof meta.score_before === "number" ? scoreAfter - (meta.score_before as number) : 0} /></div>
        </div>
        <div className="event-stat">
          <div className="lab">Funding</div>
          <div className="val">{deltas.funding ?? 0}</div>
          <div className="delta"><ScoreDelta value={deltas.funding ?? 0} /></div>
        </div>
        <div className="event-stat">
          <div className="lab">News</div>
          <div className="val">{deltas.news ?? 0}</div>
          <div className="delta"><ScoreDelta value={deltas.news ?? 0} /></div>
        </div>
        <div className="event-stat">
          <div className="lab">Hiring</div>
          <div className="val">{deltas.hiring ?? 0}</div>
          <div className="delta"><ScoreDelta value={deltas.hiring ?? 0} /></div>
        </div>
      </div>
    </div>
  );
}

function WhatChangedTimeline({ n }: { n: InboxNotification }) {
  const deltas = (n.metadata.signal_deltas as Record<string, number>) ?? {};
  const entries = Object.entries(deltas).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;

  const colorMap: Record<string, string> = {
    funding: "var(--cyan)",
    news: "var(--accent)",
    hiring: "var(--warm)",
    technology: "var(--accent-2)",
    web: "var(--text-tertiary)",
  };

  return (
    <>
      <div className="msg-section-label">
        What Changed
        <span className="line" />
      </div>
      {entries.map(([signal, val]) => (
        <div key={signal} className="sub-event">
          <span
            className="ring"
            style={{
              background: colorMap[signal] ?? "var(--accent)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              marginTop: 3,
            }}
          />
          <div>
            <div className="text" style={{ textTransform: "capitalize" }}>
              {signal} signal active
            </div>
            <div className="meta">Strength: {val} / 25</div>
          </div>
          <span className="ts">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </span>
        </div>
      ))}
    </>
  );
}

export function InboxDetail({
  notification: n,
  onMarkRead,
  onMarkUnread,
  onSnooze,
  onArchive,
}: InboxDetailProps) {
  const router = useRouter();

  if (!n) {
    return (
      <div className="msg-detail" style={{ display: "grid", placeItems: "center" }}>
        <div className="inbox-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 600 }}>Select a notification</div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
            Choose an item from the list to view details
          </div>
        </div>
      </div>
    );
  }

  const hasEventCard = n.event_type === "hot_crossing" || n.event_type === "stage_change";
  const aiThesis = n.metadata.ai_thesis as string | undefined;
  const recommendedAction = n.metadata.recommended_action as string | undefined;
  const companyInitials = n.company_name.slice(0, 2).toUpperCase();
  const shortId = n.id.slice(0, 8).toUpperCase();

  return (
    <div className="msg-detail">
      {/* Actions bar */}
      <div className="msg-detail-head">
        <div className="msg-detail-actions">
          <button
            type="button"
            className="tb-btn"
            title={n.is_read ? "Mark unread" : "Mark read"}
            onClick={() => (n.is_read ? onMarkUnread(n.id) : onMarkRead(n.id))}
          >
            <Mail className="h-3.5 w-3.5" />
            {n.is_read ? "Mark unread" : "Mark read"}
          </button>
          <button
            type="button"
            className="tb-btn"
            title="Snooze 1 hour"
            onClick={() => onSnooze(n.id)}
          >
            <Clock className="h-3.5 w-3.5" />
            Snooze 1h
          </button>
          <button
            type="button"
            className="tb-btn"
            title="Archive"
            onClick={() => onArchive(n.id)}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
          <button type="button" className="tb-btn" title="More">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="msg-body">
        {/* From row */}
        <div className="msg-from-row">
          <span className="msg-from-av">{companyInitials}</span>
          <div className="msg-from-info">
            <div className="msg-from-name">{n.company_name}</div>
            <div className="msg-from-meta">
              {n.domain} · {format(new Date(n.created_at), "MMM d, yyyy · h:mm a")}
            </div>
          </div>
          {n.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={cn(
                "band",
                tag === "HOT" ? "band-hot" : tag === "WARM" ? "band-warm" : "band-cold"
              )}
              style={{ marginLeft: "auto" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1>{n.title}</h1>

        {/* Summary */}
        <div className="msg-text-block" style={{ marginBottom: 16 }}>
          {n.summary}
        </div>

        {/* Event card */}
        {hasEventCard && <EventCard n={n} />}

        {/* AI Thesis */}
        {aiThesis && (
          <>
            <div className="msg-section-label">
              AI Thesis
              <span className="line" />
            </div>
            <div className="msg-text-block">{aiThesis}</div>
          </>
        )}

        {/* Recommended action */}
        {recommendedAction && (
          <>
            <div className="msg-section-label">
              Recommended Action
              <span className="line" />
            </div>
            <div className="msg-text-block">{recommendedAction}</div>
          </>
        )}

        {/* What Changed */}
        <WhatChangedTimeline n={n} />

        {/* Reply actions */}
        <div className="reply-actions">
          <button
            type="button"
            className="reply-btn btn-primary"
            onClick={() => router.push(`/score?company=${encodeURIComponent(n.domain)}`)}
          >
            <Mail className="h-3.5 w-3.5" />
            Draft Outreach
          </button>
          <button
            type="button"
            className="reply-btn"
            onClick={() => router.push(`/score?company=${encodeURIComponent(n.domain)}`)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Account
          </button>
          <button
            type="button"
            className="reply-btn"
            onClick={() => router.push(`/people?company=${encodeURIComponent(n.domain)}`)}
          >
            <Users className="h-3.5 w-3.5" />
            View People
          </button>
        </div>

        {/* Footer */}
        <div className="msg-footer">
          <div className="left">
            <span>IQ-{shortId}</span>
            {n.list_id && <span>· Subscribed via list</span>}
          </div>
          <div className="right">
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--text-quaternary)", cursor: "pointer", fontSize: 12 }}
            >
              Unsubscribe
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => router.push(`/score?company=${encodeURIComponent(n.domain)}`)}
            >
              Open Company →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
