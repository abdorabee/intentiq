"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { AutopilotAction, AutopilotActionType } from "@/lib/types";

const ACTION_LABELS: Record<AutopilotActionType, string> = {
  email_draft: "Generate email draft",
  webhook: "Send webhook",
  slack: "Slack notification",
  pipeline_stage: "Update pipeline stage",
  notification: "In-app notification",
};

interface ActionRowProps {
  action: AutopilotAction;
  onChange: (updated: AutopilotAction) => void;
  onRemove: () => void;
}

export default function ActionRow({ action, onChange, onRemove }: ActionRowProps) {
  const updateParam = (key: string, value: unknown) => {
    onChange({ ...action, params: { ...action.params, [key]: value } });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={action.type}
        onValueChange={(v) => onChange({ type: v as AutopilotActionType, params: {} })}
      >
        <SelectTrigger className="w-[220px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {action.type === "email_draft" && (
        <Select
          value={(action.params.tone as string) ?? "casual"}
          onValueChange={(v) => updateParam("tone", v)}
        >
          <SelectTrigger className="w-[140px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casual">Casual tone</SelectItem>
            <SelectItem value="formal">Formal tone</SelectItem>
            <SelectItem value="executive">Executive tone</SelectItem>
          </SelectContent>
        </Select>
      )}

      {action.type === "webhook" && (
        <Input
          placeholder="https://your-app.com/webhook"
          value={(action.params.url as string) ?? ""}
          onChange={(e) => updateParam("url", e.target.value)}
          className="flex-1 min-w-[240px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
        />
      )}

      {action.type === "slack" && (
        <Input
          placeholder="https://hooks.slack.com/services/..."
          value={(action.params.webhook_url as string) ?? ""}
          onChange={(e) => updateParam("webhook_url", e.target.value)}
          className="flex-1 min-w-[240px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
        />
      )}

      {action.type === "pipeline_stage" && (
        <Select
          value={(action.params.stage as string) ?? "engaged"}
          onValueChange={(v) => updateParam("stage", v)}
        >
          <SelectTrigger className="w-[160px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cold">Cold</SelectItem>
            <SelectItem value="warming">Warming</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="engaged">Engaged</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      )}

      {action.type === "email_draft" && (
        <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5">
          0.5 cr
        </span>
      )}

      <button
        onClick={onRemove}
        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
        aria-label="Remove action"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
