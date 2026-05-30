"use client";

import {
  workflowStatus,
  workflowDesc,
  conditionSummary,
  relTime,
  computeMatchRate,
  WORKFLOW_TEMPLATES,
  createWorkflow,
  type WorkflowFilter,
} from "@/lib/autopilot-display";
import type { DbAutopilotWorkflow, DbAutopilotRun } from "@/lib/types";

interface WorkflowListPaneProps {
  workflows: DbAutopilotWorkflow[];
  runsByWorkflow: Record<string, DbAutopilotRun[]>;
  selectedId: string | null;
  limit: number | null;
  search: string;
  filter: WorkflowFilter;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: WorkflowFilter) => void;
  onSelect: (id: string) => void;
  onCreated: (wf: DbAutopilotWorkflow) => void;
}

export default function WorkflowListPane({
  workflows,
  runsByWorkflow,
  selectedId,
  limit,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelect,
  onCreated,
}: WorkflowListPaneProps) {
  const filtered = workflows.filter(wf => {
    const status = workflowStatus(wf);
    if (filter !== "all" && status !== filter) return false;
    if (search.trim() && !wf.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleNew() {
    try {
      const wf = await createWorkflow({
        name: `workflow_${Date.now().toString(36).slice(-6)}`,
        conditions: [{ type: "score_above", params: { threshold: 75 } }],
        condition_logic: "any",
        actions: [{ type: "notification", params: {} }],
      });
      onCreated(wf);
    } catch { /* limit reached */ }
  }

  async function handleTemplate(idx: number) {
    const t = WORKFLOW_TEMPLATES[idx];
    if (!t) return;
    try {
      const wf = await createWorkflow({
        name: t.name,
        conditions: t.conditions,
        condition_logic: t.condition_logic,
        actions: t.actions,
      });
      onCreated(wf);
    } catch { /* limit */ }
  }

  function firesCount(wf: DbAutopilotWorkflow) {
    const runs = runsByWorkflow[wf.id] ?? [];
    if (runs.length > 0) {
      return runs.reduce((s, r) => s + r.companies_triggered, 0);
    }
    return wf.total_runs > 0 ? wf.total_runs : "—";
  }

  return (
    <div className="ap-list-pane">
      <div className="ap-list-head">
        <div className="title">Workflows</div>
        <div className="pill">
          {workflows.length}{limit !== null ? `/${limit}` : ""}
        </div>
        <button type="button" className="new-btn" onClick={handleNew}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10"><path d="M6 2v8M2 6h8" /></svg>
        </button>
      </div>

      <div className="ap-search-wrap">
        <div className="ap-search">
          <svg className="ic" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3" /><path d="M7 7l3 3" /></svg>
          <input
            type="text"
            placeholder="Search workflows…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="ap-filter-tabs">
        {(["all", "active", "paused", "draft"] as const).map(f => (
          <span
            key={f}
            className={`ap-filter-tab${filter === f ? " active" : ""}`}
            style={{ textTransform: "capitalize" }}
            onClick={() => onFilterChange(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </span>
        ))}
      </div>

      <div className="ap-list">
        {filtered.map(wf => {
          const status = workflowStatus(wf);
          const runs = runsByWorkflow[wf.id] ?? [];
          const match = computeMatchRate(runs);
          const pulseCls = status === "active" ? "" : status === "paused" ? " paused" : " draft";
          return (
            <div
              key={wf.id}
              className={`ap-item${selectedId === wf.id ? " active" : ""}`}
              onClick={() => onSelect(wf.id)}
            >
              <div className={`pulse${pulseCls}`} />
              <div className="body">
                <div className="name">{wf.name}</div>
                <div className="desc">{workflowDesc(wf)}</div>
                <div className="meta">
                  <span>{wf.actions.length} action{wf.actions.length !== 1 ? "s" : ""}</span>
                  {match !== null && (<><span>·</span><span>{match}% match</span></>)}
                  <span>·</span>
                  <span>{status === "draft" ? "not tested" : `last fire ${relTime(wf.last_run_at)}`}</span>
                </div>
              </div>
              <div>
                <div className="fires">{firesCount(wf)}</div>
                <div className="fires-label">
                  {status === "draft" ? "Draft" : "Fires"}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ margin: "14px 4px 8px", fontSize: 11, fontWeight: 500, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 8px" }}>Templates</div>
        {WORKFLOW_TEMPLATES.slice(1).map((t, i) => (
          <div
            key={t.name}
            className="ap-item"
            style={{ opacity: 0.85 }}
            onClick={() => handleTemplate(i + 1)}
          >
            <div className="pulse draft" />
            <div className="body">
              <div className="name">{t.name}</div>
              <div className="desc">{t.conditions.map(c => conditionSummary(c)).join(" · ")}</div>
            </div>
            <div>
              <div className="fires">+</div>
              <div className="fires-label">Add</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
