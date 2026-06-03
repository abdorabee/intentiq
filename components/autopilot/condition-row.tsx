"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { AutopilotCondition, AutopilotConditionType } from "@/lib/types";

const CONDITION_LABELS: Record<AutopilotConditionType, string> = {
  score_above: "Score goes above",
  score_below: "Score drops below",
  score_change: "Score changes by",
  band_change: "Band changes",
  signal_spike: "Signal spikes",
};

interface ConditionRowProps {
  condition: AutopilotCondition;
  onChange: (updated: AutopilotCondition) => void;
  onRemove: () => void;
}

export default function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps) {
  const updateParam = (key: string, value: unknown) => {
    onChange({ ...condition, params: { ...condition.params, [key]: value } });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={condition.type}
        onValueChange={(v) => onChange({ type: v as AutopilotConditionType, params: {} })}
      >
        <SelectTrigger className="w-[200px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CONDITION_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Parameter inputs based on condition type */}
      {(condition.type === "score_above" || condition.type === "score_below") && (
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="75"
          value={(condition.params.threshold as number) ?? ""}
          onChange={(e) => updateParam("threshold", Number(e.target.value))}
          className="w-24 bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100"
        />
      )}

      {condition.type === "score_change" && (
        <>
          <Select
            value={(condition.params.direction as string) ?? "any"}
            onValueChange={(v) => updateParam("direction", v)}
          >
            <SelectTrigger className="w-[120px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Up</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="10"
            value={(condition.params.min_change as number) ?? ""}
            onChange={(e) => updateParam("min_change", Number(e.target.value))}
            className="w-24 bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100"
          />
          <span className="text-xs text-slate-500">points</span>
        </>
      )}

      {condition.type === "band_change" && (
        <>
          <Select
            value={(condition.params.from as string) ?? "any"}
            onValueChange={(v) => updateParam("from", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="w-[110px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="COLD">COLD</SelectItem>
              <SelectItem value="WARM">WARM</SelectItem>
              <SelectItem value="HOT">HOT</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-500">to</span>
          <Select
            value={(condition.params.to as string) ?? "any"}
            onValueChange={(v) => updateParam("to", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="w-[110px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="COLD">COLD</SelectItem>
              <SelectItem value="WARM">WARM</SelectItem>
              <SelectItem value="HOT">HOT</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}

      {condition.type === "signal_spike" && (
        <>
          <Select
            value={(condition.params.signal as string) ?? "funding"}
            onValueChange={(v) => updateParam("signal", v)}
          >
            <SelectTrigger className="w-[140px] bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="funding">Funding</SelectItem>
              <SelectItem value="hiring">Hiring</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="web">Web</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-500">above</span>
          <Input
            type="number"
            min={10}
            max={100}
            step={10}
            placeholder="70"
            value={((condition.params.min_ratio as number) ?? 0.7) * 100}
            onChange={(e) => updateParam("min_ratio", Number(e.target.value) / 100)}
            className="w-20 bg-slate-100 dark:bg-foreground/[0.05] border-slate-200 dark:border-foreground/[0.08] text-slate-800 dark:text-slate-100"
          />
          <span className="text-xs text-slate-500">%</span>
        </>
      )}

      <button
        onClick={onRemove}
        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
        aria-label="Remove condition"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
