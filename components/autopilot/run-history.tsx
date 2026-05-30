"use client";

import { useState, useCallback } from "react";
import type { DbAutopilotRun, DbAutopilotAction } from "@/lib/types";

const statusColor = (status: string) => {
  if (status === "completed") return "var(--hot)";
  if (status === "failed") return "var(--red)";
  if (status === "partial") return "var(--warm)";
  return "var(--cyan)";
};

interface RunHistoryProps {
  runs: DbAutopilotRun[];
}

export default function RunHistory({ runs }: RunHistoryProps) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [actions, setActions] = useState<DbAutopilotAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const toggleRun = useCallback(async (runId: string) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      setActions([]);
      return;
    }
    setExpandedRun(runId);
    setLoadingActions(true);
    try {
      const res = await fetch(`/api/autopilot/runs/${runId}`);
      const data = await res.json();
      setActions(data.actions ?? []);
    } finally {
      setLoadingActions(false);
    }
  }, [expandedRun]);

  if (runs.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
        No runs yet. Workflows run on their configured schedule.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr 1fr 80px 140px", gap: 12, padding: "0 16px", height: 34, alignItems: "center", fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>
        <div /><div>Status</div><div>Checked</div><div>Triggered</div><div>Credits</div><div>Date</div>
      </div>
      {runs.map(run => (
        <div key={run.id}>
          <div
            style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr 1fr 80px 140px", gap: 12, padding: "10px 16px", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", fontSize: 13 }}
            onClick={() => toggleRun(run.id)}
          >
            <span style={{ color: "var(--text-tertiary)" }}>{expandedRun === run.id ? "▾" : "▸"}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: statusColor(run.status), textTransform: "uppercase" }}>{run.status}</span>
            <span style={{ color: "var(--text-secondary)" }}>{run.companies_checked}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{run.companies_triggered}</span>
            <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{run.credits_used}</span>
            <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{new Date(run.started_at).toLocaleString()}</span>
          </div>
          {expandedRun === run.id && (
            <div style={{ padding: "8px 16px 12px 48px", background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--border-subtle)" }}>
              {loadingActions ? (
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Loading actions…</p>
              ) : actions.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No actions triggered.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {actions.map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "6px 0" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", minWidth: 100 }}>{a.company_name}</span>
                      <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{a.old_score ?? "?"} → {a.new_score}</span>
                      <span style={{ color: "var(--text-quaternary)" }}>{a.action_type.replace("_", " ")}</span>
                      <span style={{ marginLeft: "auto", color: "var(--text-quaternary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.trigger_reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
