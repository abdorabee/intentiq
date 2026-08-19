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
  const hotCount = hero.firingAccounts.length;
  const isFilteredEmpty = filtered.length === 0;
  const hasFilters = Boolean(search) || tab !== "all";

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
          <button type="button" className="tb-btn outlined" disabled title="Coming soon">
            <svg className="ic" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M2 3h8v2H2zM2 7h8v2H2z" />
            </svg>
            Import CSV
          </button>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-card">
          <div className="label">Accounts</div>
          <div className="num">{hero.totalAccounts}</div>
          <div className="lists-stat-sub">
            {hero.listCount} lists · {hero.overlapCount} overlapping
          </div>
          <div className="chart-legend">
            <span className="lg hot"><span className="swatch" />HOT {mix.hot}</span>
            <span className="lg warm"><span className="swatch" />WARM {mix.warm}</span>
            <span className="lg cold"><span className="swatch" />COLD {mix.cold}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Hottest list</div>
          <div className="num lists-stat-name">{hero.hottestList?.name ?? "—"}</div>
          <div className="lists-stat-sub">
            {hero.hottestList
              ? `${hero.hottestList.hotThisWeek} of ${hero.hottestList.total} HOT · avg ${hero.hottestList.avgScore}`
              : "Create a smart list to track high-intent accounts"}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">HOT accounts</div>
          <div className="num hot">{hotCount}</div>
          <div className="lists-stat-sub">
            {hotCount === 0
              ? "No HOT accounts yet — score companies to populate lists"
              : `${hotCount} firing across lists`}
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
        <div className="range-tabs">
          <button type="button" className={`range-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>
            All <span className="mono">{summaries.length}</span>
          </button>
          <button type="button" className={`range-tab${tab === "smart" ? " active" : ""}`} onClick={() => setTab("smart")}>
            Smart <span className="mono">{smartCount}</span>
          </button>
          <button type="button" className={`range-tab${tab === "manual" ? " active" : ""}`} onClick={() => setTab("manual")}>
            Manual <span className="mono">{manualCount}</span>
          </button>
        </div>
      </div>

      {isFilteredEmpty ? (
        <div className="lists-empty">
          <div className="lists-empty-title">{hasFilters ? "No lists match" : "No lists yet"}</div>
          <div className="lists-empty-sub">
            {hasFilters
              ? "Try a different search or filter."
              : "Group accounts by signal, segment, or by hand."}
          </div>
          {!hasFilters && (
            <button type="button" className="btn-primary" onClick={() => openCreateModal?.()}>
              New list
            </button>
          )}
        </div>
      ) : (
        <div className="list-grid">
          {filtered.map((s) => (
            <ListCard key={s.id} summary={s} onClick={() => router.push(`/lists/${s.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
