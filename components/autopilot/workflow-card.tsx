"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Clock, Zap, Calendar } from "lucide-react";
import type { DbAutopilotWorkflow } from "@/lib/types";

interface WorkflowCardProps {
  workflow: DbAutopilotWorkflow;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (workflow: DbAutopilotWorkflow) => void;
  onDelete: (id: string) => void;
}

export default function WorkflowCard({ workflow, onToggle, onEdit, onDelete }: WorkflowCardProps) {
  const conditionSummary = workflow.conditions
    .map((c) => {
      switch (c.type) {
        case "score_above": return `Score > ${c.params.threshold}`;
        case "score_below": return `Score < ${c.params.threshold}`;
        case "score_change": return `Score ${c.params.direction} ${c.params.min_change}+`;
        case "band_change": return `Band change${c.params.to ? ` → ${c.params.to}` : ""}`;
        case "signal_spike": return `${c.params.signal} spike`;
        default: return c.type;
      }
    })
    .join(` ${workflow.condition_logic.toUpperCase()} `);

  const actionSummary = workflow.actions.map((a) => {
    switch (a.type) {
      case "email_draft": return "Email draft";
      case "webhook": return "Webhook";
      case "slack": return "Slack";
      case "pipeline_stage": return `→ ${a.params.stage}`;
      case "notification": return "Notify";
      default: return a.type;
    }
  }).join(", ");

  return (
    <Card className={`border transition-all ${workflow.is_enabled ? "border-slate-200 dark:border-foreground/[0.08]" : "border-slate-200 dark:border-foreground/[0.04] opacity-60"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className={`h-4 w-4 shrink-0 ${workflow.is_enabled ? "text-cyan-400" : "text-slate-500"}`} />
            <h3 className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{workflow.name}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggle(workflow.id, !workflow.is_enabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${workflow.is_enabled ? "bg-cyan-500" : "bg-slate-300 dark:bg-foreground/[0.1]"}`}
              aria-label={workflow.is_enabled ? "Disable" : "Enable"}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${workflow.is_enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
            <button
              onClick={() => onEdit(workflow)}
              className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(workflow.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge className="text-[10px] bg-slate-100 dark:bg-foreground/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-foreground/[0.08]">
            <Calendar className="h-3 w-3 mr-1" />
            {workflow.schedule}
          </Badge>
          <Badge className="text-[10px] bg-slate-100 dark:bg-foreground/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-foreground/[0.08]">
            {workflow.source_type === "watchlist" ? "Watchlist" : `${workflow.source_domains?.length ?? 0} domains`}
          </Badge>
        </div>

        <div className="text-xs space-y-1">
          <p className="text-slate-500">
            <span className="text-slate-400">IF</span> {conditionSummary}
          </p>
          <p className="text-slate-500">
            <span className="text-slate-400">THEN</span> {actionSummary}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-foreground/[0.04]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {workflow.total_runs} runs
          </span>
          {workflow.last_run_at && (
            <span>
              Last: {new Date(workflow.last_run_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
