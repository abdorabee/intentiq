"use client";

import { cn } from "@/lib/utils";

export interface ToolCallEvent {
  name: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallEvent[];
  isStreaming?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  score_company: "Scoring company",
  add_to_watchlist: "Adding to watchlist",
  remove_from_watchlist: "Removing from watchlist",
  get_pipeline_summary: "Fetching pipeline",
  get_company_details: "Looking up company",
  search_scored_companies: "Searching scores",
  draft_outreach_email: "Preparing email data",
  update_pipeline_stage: "Updating pipeline",
};

function ToolCallCard({ tool }: { tool: ToolCallEvent }) {
  const label = TOOL_LABELS[tool.name] ?? tool.name;
  const hasResult = tool.result !== undefined;
  const resultObj = tool.result as Record<string, unknown> | undefined;
  const isSuccess = resultObj && (resultObj.success === true || resultObj.score !== undefined || resultObj.intent_score !== undefined || resultObj.results !== undefined || resultObj.total !== undefined);

  return (
    <div className="my-2 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]">
        <span className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          hasResult ? (isSuccess ? "bg-emerald-400" : "bg-amber-400") : "bg-cyan-400 animate-pulse"
        )} />
        <span className="text-slate-400">{label}</span>
        {typeof tool.args?.domain === "string" && (
          <span className="text-slate-600">→ {tool.args.domain}</span>
        )}
      </div>
      {hasResult && resultObj && (
        <div className="mt-1.5 text-[11px] text-slate-500">
          {typeof resultObj.intent_score === "number" && (
            <span className="text-slate-300">
              Score: {resultObj.intent_score}/100 [{String(resultObj.score_band)}]
            </span>
          )}
          {typeof resultObj.message === "string" && (
            <span className="text-slate-300">{resultObj.message}</span>
          )}
          {typeof resultObj.total === "number" && (
            <span className="text-slate-300">{resultObj.total} companies in pipeline</span>
          )}
          {Array.isArray(resultObj.results) && (
            <span className="text-slate-300">{resultObj.results.length} results found</span>
          )}
          {typeof resultObj.error === "string" && (
            <span className="text-amber-400">{resultObj.error}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed",
        isUser
          ? "bg-cyan-500/10 text-cyan-800 dark:text-cyan-100 border border-cyan-500/20"
          : "bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]"
      )}>
        {message.toolCalls?.map((tool, i) => (
          <ToolCallCard key={i} tool={tool} />
        ))}
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 -mb-0.5" />
        )}
      </div>
    </div>
  );
}
