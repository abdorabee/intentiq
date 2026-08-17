"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListCardSummary, ListsHeroStats } from "@/lib/lists-types";
import { ListCard } from "./list-card";
import { useListsTopbar } from "@/components/dashboard/lists-topbar-context";

interface ListOverviewProps {
  summaries: ListCardSummary[];
  hero: ListsHeroStats;
}

type TabFilter = "all" | "smart" | "manual";

export function ListOverview({ summaries, hero }: ListOverviewProps) {
  const router = useRouter();
  const { openCreateModal } = useListsTopbar();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  const smartCount = summaries.filter((s) => s.list_type === "smart").length;
  const manualCount = summaries.filter((s) => s.list_type === "manual").length;

  const filtered = useMemo(() => {
    return summaries.filter((s) => {
      if (tab === "smart" && s.list_type !== "smart") return false;
      if (tab === "manual" && s.list_type !== "manual") return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [summaries, search, tab]);

  const mix = hero.bandMix;
  const hottestSummary = hero.hottestList ? summaries.find((s) => s.id === hero.hottestList!.id) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Lists</div>
          <div className="page-sub">
            Group accounts by intent, segment or playbook ·{" "}
            <span className="mono" style={{ color: "var(--text-secondary)" }}>{hero.listCount} lists</span>
            {" · "}
            <span className="mono" style={{ color: "var(--text-secondary)" }}>{hero.totalAccounts} accounts total</span>
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="tb-btn outlined" onClick={() => alert("CSV import coming soon")}>
            Import CSV
          </button>
        </div>
      </div>

      <div className="lists-hero">
        <div className="hero-block">
          <div className="lbl">Coverage across lists</div>
          <div className="num">{hero.totalAccounts}<span className="of"> accounts</span></div>
          <div className="sub">
            Across <strong>{hero.listCount} lists</strong> · <strong>{hero.overlapCount}</strong> in more than one list ·{" "}
            <strong>{hero.recentlyUpdatedCount}</strong> updated in the last hour
          </div>
          <div className="hero-segs">
            <div className="seg" style={{ background: "var(--hot)", flex: mix.hot }}>{mix.hot}</div>
            <div className="seg" style={{ background: "var(--warm)", flex: mix.warm }}>{mix.warm}</div>
            <div className="seg" style={{ background: "var(--cold)", opacity: 0.75, flex: mix.cold }}>{mix.cold}</div>
          </div>
          <div className="hero-segs-leg">
            <span><span className="sw" style={{ background: "var(--hot)" }} />HOT {mix.hot}</span>
            <span><span className="sw" style={{ background: "var(--warm)" }} />WARM {mix.warm}</span>
            <span><span className="sw" style={{ background: "var(--cold)", opacity: 0.75 }} />COLD {mix.cold}</span>
            <span style={{ marginLeft: "auto", color: "var(--text-quaternary)" }}>across all lists</span>
          </div>
        </div>
        <div className="hero-divider" />
        <div className="hero-block">
          <div className="lbl">Hottest list right now</div>
          <div className="num" style={{ fontSize: 24 }}>
            {hero.hottestList?.name ?? "—"}
          </div>
          <div className="sub">
            {hero.hottestList ? (
              <>
                <strong>{hero.hottestList.hotThisWeek} of {hero.hottestList.total}</strong> accounts HOT · avg score{" "}
                <span className="mono" style={{ color: "var(--hot)" }}>{hero.hottestList.avgScore}</span>
              </>
            ) : (
              "Create a smart list to track high-intent accounts"
            )}
          </div>
          {hottestSummary && (
            <div style={{ marginTop: "auto" }}>
              <div className="hero-segs" style={{ height: 18 }}>
                <div className="seg" style={{ background: "var(--hot)", flex: hottestSummary.bandMix.hot }} />
                <div className="seg" style={{ background: "var(--warm)", flex: hottestSummary.bandMix.warm }} />
                <div className="seg" style={{ background: "var(--cold)", opacity: 0.7, flex: hottestSummary.bandMix.cold }} />
              </div>
              <div className="hero-segs-leg">
                <span><span style={{ color: "var(--hot)" }}>●</span>{hottestSummary.bandMix.hot}</span>
                <span><span style={{ color: "var(--warm)" }}>●</span>{hottestSummary.bandMix.warm}</span>
                <span><span style={{ color: "var(--text-tertiary)" }}>●</span>{hottestSummary.bandMix.cold}</span>
              </div>
            </div>
          )}
        </div>
        <div className="hero-divider" />
        <div className="hero-block">
          <div className="lbl">Accounts firing</div>
          <div className="hero-fires">
            {hero.firingAccounts.length === 0 ? (
              <div className="sub">No HOT accounts yet — score companies to populate lists.</div>
            ) : (
              hero.firingAccounts.map((a) => (
                <div key={a.domain} className="fire-row">
                  <span className="dot" style={{ background: "var(--hot)" }} />
                  <span className="name"><strong>{a.company_name}</strong> · {a.listName}</span>
                  <span className="val">{a.score}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="tools-row">
        <div className="search-input">
          <svg className="ic" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
            <circle cx="5" cy="5" r="3" /><path d="M7 7l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search lists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="type-tabs">
          <button type="button" className={`tt${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>
            All <span className="pill">{summaries.length}</span>
          </button>
          <button type="button" className={`tt${tab === "smart" ? " active" : ""}`} onClick={() => setTab("smart")}>
            Smart <span className="pill">{smartCount}</span>
          </button>
          <button type="button" className={`tt${tab === "manual" ? " active" : ""}`} onClick={() => setTab("manual")}>
            Manual <span className="pill">{manualCount}</span>
          </button>
        </div>
      </div>

      <div className="list-grid">
        {filtered.map((s) => (
          <ListCard key={s.id} summary={s} onClick={() => router.push(`/lists/${s.id}`)} />
        ))}
        <div
          className="list-card new-card"
          onClick={() => openCreateModal?.()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openCreateModal?.()}
        >
          <div className="new-card-inner">
            <div className="plus">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13">
                <path d="M7 3v8M3 7h8" />
              </svg>
            </div>
            <div className="t">Create a new list</div>
            <div className="s">Group accounts by signal, segment, or by hand. Smart lists update themselves as new accounts qualify.</div>
            <div className="opts">
              <span className="o">Smart rules</span>
              <span className="o">Manual</span>
              <span className="o">CSV import</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
