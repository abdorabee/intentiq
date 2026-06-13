import type {
  AutopilotAction,
  AutopilotCondition,
  DbAutopilotRun,
  DbAutopilotWorkflow,
  DbAutopilotAction,
} from "@/lib/types";

export type WorkflowStatus = "active" | "paused" | "draft";

export type WorkflowFilter = "all" | WorkflowStatus;

export function workflowStatus(wf: DbAutopilotWorkflow): WorkflowStatus {
  if (wf.is_enabled) return "active";
  if (wf.total_runs > 0 || wf.last_run_at) return "paused";
  return "draft";
}

export function relTime(iso: string | null) {
  if (!iso) return "never";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function paramStr(params: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = params[key];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return undefined;
}

export function conditionSummary(c: AutopilotCondition): string {
  const p = c.params;
  switch (c.type) {
    case "score_above": return `score ≥ ${p.threshold ?? 75}`;
    case "score_below": return `score < ${p.threshold ?? 50}`;
    case "score_change": return `score ${p.direction ?? "any"} ${p.min_change ?? 10}+`;
    case "band_change": {
      const to = paramStr(c.params, "to", "target", "band");
      const from = paramStr(c.params, "from");
      if (to && from) return `band ${from} → ${to}`;
      if (to) return `band → ${to}`;
      if (from) return `band from ${from}`;
      return "band change";
    }
    case "signal_spike": {
      const signal = paramStr(p, "signal", "signal_type", "signalKey") ?? "signal";
      return `${signal} spike`;
    }
    default: return c.type;
  }
}

export function actionSummary(a: AutopilotAction): string {
  const p = a.params;
  switch (a.type) {
    case "email_draft": return "draft";
    case "webhook": return "webhook";
    case "slack": return "slack";
    case "pipeline_stage": return `→ ${paramStr(p, "stage", "to") ?? "engaged"}`;
    case "notification": return "notify";
    default: return a.type;
  }
}

export function workflowDesc(wf: DbAutopilotWorkflow): string {
  const cond = wf.conditions.map(conditionSummary).join(" · ");
  const acts = wf.actions.map(actionSummary).join(" + ");
  return `${cond} → ${acts}`;
}

export interface ConditionToken {
  key?: string;
  op?: string;
  val?: string;
  valHot?: boolean;
}

export function conditionToTokens(c: AutopilotCondition): ConditionToken[] {
  switch (c.type) {
    case "score_above":
      return [{ key: "score", op: "≥", val: String(c.params.threshold ?? 75) }];
    case "score_below":
      return [{ key: "score", op: "<", val: String(c.params.threshold ?? 50) }];
    case "band_change": {
      const to = paramStr(c.params, "to", "target", "band") ?? "HOT";
      const from = paramStr(c.params, "from");
      if (from) {
        return [
          { key: "band", op: "→", val: `${from} → ${to}` },
        ];
      }
      return [{ key: "band", op: "→", val: to, valHot: to === "HOT" }];
    }
    case "score_change":
      return [
        { key: "score", op: c.params.direction === "down" ? "↓" : "↑", val: `±${c.params.min_change ?? 10}` },
      ];
    case "signal_spike": {
      const signal = paramStr(c.params, "signal", "signal_type", "signalKey") ?? "signal";
      return [
        { key: signal, op: "≥", val: `${Math.round(((c.params.min_ratio as number) ?? 0.7) * 100)}%` },
      ];
    }
    default:
      return [{ key: c.type, op: "=", val: "true" }];
  }
}

export function actionToDisplay(a: AutopilotAction): { label: string; target: string; badge: string } {
  switch (a.type) {
    case "email_draft":
      return { label: "draft_email →", target: `"${a.params.tone ?? "casual"}" tone`, badge: "claude" };
    case "webhook":
      return { label: "webhook →", target: String(a.params.url ?? "endpoint"), badge: "http" };
    case "slack":
      return { label: "slack_notify →", target: "channel webhook", badge: "slack" };
    case "pipeline_stage":
      return { label: "pipeline_stage →", target: paramStr(a.params, "stage", "to") ?? "engaged", badge: "crm" };
    case "notification":
      return { label: "notify →", target: "in-app alert", badge: "vesperwise" };
    default:
      return { label: a.type, target: "", badge: "" };
  }
}

export function computeMatchRate(runs: DbAutopilotRun[]): number | null {
  const completed = runs.filter(r => r.status === "completed" || r.status === "partial");
  if (completed.length === 0) return null;
  const checked = completed.reduce((s, r) => s + r.companies_checked, 0);
  const triggered = completed.reduce((s, r) => s + r.companies_triggered, 0);
  if (checked === 0) return null;
  return Math.round((triggered / checked) * 1000) / 10;
}

export function computeMonthlyFires(runs: DbAutopilotRun[]): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return runs
    .filter(r => new Date(r.started_at).getTime() >= thirtyDaysAgo)
    .reduce((s, r) => s + r.companies_triggered, 0);
}

export function computeAvgLatency(runs: DbAutopilotRun[]): string {
  const withEnd = runs.filter(r => r.completed_at);
  if (withEnd.length === 0) return "—";
  const avgMs = withEnd.reduce((s, r) => {
    return s + (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime());
  }, 0) / withEnd.length;
  const sec = avgMs / 1000;
  if (sec < 10) return `${sec.toFixed(1)}s`;
  return `${Math.round(sec)}s`;
}

export interface FireBucket {
  date: string;
  count: number;
  iso: string;
}

export function bucketFiresByDay(runs: DbAutopilotRun[]): FireBucket[] {
  const map = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  for (const r of runs) {
    const key = new Date(r.started_at).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.companies_triggered);
  }
  return Array.from(map.entries()).map(([iso, count]) => ({
    iso,
    count,
    date: new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
}

export function peakFireDay(buckets: FireBucket[]): { count: number; date: string } | null {
  if (buckets.length === 0) return null;
  const peak = buckets.reduce((best, b) => (b.count > best.count ? b : best), buckets[0]);
  if (peak.count === 0) return null;
  return { count: peak.count, date: peak.date };
}

export function lastFireFromActions(actions: DbAutopilotAction[]): { company: string; ago: string } | null {
  if (actions.length === 0) return null;
  const a = actions[0];
  return { company: a.company_name, ago: relTime(a.created_at) };
}

export const WORKFLOW_TEMPLATES = [
  {
    name: "when_account_goes_hot",
    conditions: [{ type: "band_change" as const, params: { to: "HOT" } }],
    condition_logic: "any" as const,
    actions: [
      { type: "notification" as const, params: {} },
      { type: "email_draft" as const, params: { tone: "casual" } },
    ],
  },
  {
    name: "layoff_signal_pause",
    conditions: [{ type: "signal_spike" as const, params: { signal: "news", min_ratio: 0.5 } }],
    condition_logic: "any" as const,
    actions: [{ type: "notification" as const, params: {} }],
  },
  {
    name: "hot_to_ceo_brief",
    conditions: [
      { type: "band_change" as const, params: { to: "HOT" } },
      { type: "score_above" as const, params: { threshold: 85 } },
    ],
    condition_logic: "all" as const,
    actions: [{ type: "slack" as const, params: { webhook_url: "" } }],
  },
];

export async function patchWorkflow(
  id: string,
  patch: Partial<DbAutopilotWorkflow>
): Promise<DbAutopilotWorkflow> {
  const res = await fetch(`/api/autopilot/workflows/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to save workflow");
  return data as DbAutopilotWorkflow;
}

export async function createWorkflow(body: {
  name: string;
  conditions: AutopilotCondition[];
  condition_logic?: "any" | "all";
  actions: AutopilotAction[];
}): Promise<DbAutopilotWorkflow> {
  const res = await fetch("/api/autopilot/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create workflow");
  return data as DbAutopilotWorkflow;
}
