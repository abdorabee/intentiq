"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, ArrowUp, ChevronDown, X,
  AlertCircle, DollarSign, Clock, Target, UserCheck, XCircle, Zap,
} from "lucide-react";
import type { IntentScore, ConversationAnalysis, ConversationSignalType } from "@/lib/types";
import { ScoreResult } from "@/components/score/score-result";
import type { LucideIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "idle" | "scoring" | "narrating" | "ready" | "following-up";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "indicator" | "score-card" | "conversation-analysis";
  content: string;
  scoreData?: IntentScore;
  conversationAnalysis?: ConversationAnalysis;
  imagePreview?: string; // blob URL shown in user bubble
  streaming?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAMPLE_CHIPS = [
  { label: "Score a Target",    query: "score acme.com" },
  { label: "Find HOT Leads",    query: "show HOT companies" },
  { label: "My Watchlist",      query: "watchlist" },
  { label: "Bulk Score",        query: "bulk" },
];

const SIGNAL_COLORS: Record<string, string> = {
  funding:    "from-cyan-500 to-sky-400",
  hiring:     "from-emerald-500 to-green-400",
  news:       "from-amber-500 to-orange-400",
  technology: "from-blue-500 to-cyan-400",
  web:        "from-pink-500 to-rose-400",
};

const SIGNAL_SHORT: Record<string, string> = {
  funding: "Fund", hiring: "Hire", news: "News", technology: "Tech", web: "Web",
};

const SIGNAL_KEYS = ["funding", "hiring", "news", "technology", "web"] as const;

const CONV_SIGNAL_ICONS: Record<ConversationSignalType, LucideIcon> = {
  pain_point:     AlertCircle,
  budget_mention: DollarSign,
  timeline:       Clock,
  competitor:     Target,
  champion:       UserCheck,
  objection:      XCircle,
  buying_trigger: Zap,
};

const CONV_SIGNAL_LABELS: Record<ConversationSignalType, string> = {
  pain_point:     "Pain Point",
  budget_mention: "Budget",
  timeline:       "Timeline",
  competitor:     "Competitor",
  champion:       "Champion",
  objection:      "Objection",
  buying_trigger: "Trigger",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDomain(query: string): string | null {
  const match = query.match(/(?:score\s+)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/i);
  return match ? match[1].toLowerCase() : null;
}

function buildNarrationPrompt(result: IntentScore): string {
  const signals = (Object.keys(result.signals) as Array<keyof typeof result.signals>)
    .filter((k) => k !== "latestSignalDate")
    .map((k) => {
      const s = result.signals[k] as { score: number; max: number };
      return `${String(k)} ${s.score}/${s.max}`;
    })
    .join(" · ");

  const icpLine = result.icp_fit_score != null ? `ICP Fit: ${result.icp_fit_score}%` : "";

  return [
    `[Score result — ${result.company} (${result.domain})]`,
    `Intent: ${result.intent_score}/100 — ${result.score_band}${icpLine ? " · " + icpLine : ""}`,
    `Signals: ${signals}`,
    result.ai_summary ? `Context: ${result.ai_summary}` : "",
    result.why_now ? `Why now: ${result.why_now}` : "",
    result.recommended_action ? `Suggested action: ${result.recommended_action}` : "",
    "",
    "Give me a direct, honest 2–3 sentence assessment of this result and exactly what I should do next. Flowing prose, direct voice, no bullet points.",
  ]
    .filter(Boolean)
    .join("\n");
}

let msgCounter = 0;
function uid() { return `msg-${++msgCounter}`; }

function getBandCfg(band: string) {
  if (band === "HOT")  return { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", ring: "from-emerald-400 to-green-500",  score: "text-emerald-400", pulse: "animate-score-hot"  };
  if (band === "WARM") return { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",       ring: "from-amber-400 to-orange-500",   score: "text-amber-400",  pulse: "animate-score-warm" };
  return                      { badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",       ring: "from-slate-600 to-slate-700",    score: "text-slate-300",  pulse: ""                  };
}

function getIntentCfg(intent: string) {
  if (intent === "hot")  return { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase", ring: "from-emerald-400 to-green-500",  score: "text-emerald-400" };
  if (intent === "warm") return { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30 uppercase",       ring: "from-amber-400 to-orange-500",   score: "text-amber-400"  };
  if (intent === "cold") return { badge: "bg-slate-500/20 text-slate-400 border-slate-500/30 uppercase",       ring: "from-slate-600 to-slate-700",    score: "text-slate-300"  };
  return                        { badge: "bg-slate-400/20 text-slate-400 border-slate-400/30 uppercase",       ring: "from-slate-500 to-slate-600",    score: "text-slate-400"  };
}

function getIcpCfg(score: number) {
  if (score >= 80) return { label: "Strong Fit",  cls: "bg-emerald-500 text-white border-emerald-600" };
  if (score >= 60) return { label: "Good Fit",    cls: "bg-cyan-500 text-white border-cyan-600" };
  if (score >= 40) return { label: "Partial Fit", cls: "bg-amber-500 text-white border-amber-600" };
  return                   { label: "Weak Fit",   cls: "bg-slate-500 text-white border-slate-600" };
}

// ── SSE streaming ─────────────────────────────────────────────────────────────

async function streamChat(
  message: string,
  sessionId: string | null,
  onChunk: (text: string) => void,
  onDone:  (sid: string)  => void,
  onError: (err: string)  => void,
  attachedImage?: File | null,
  onToolResult?: (name: string, result: unknown) => void
) {
  try {
    let res: Response;

    if (attachedImage) {
      const formData = new FormData();
      formData.append("message", message);
      if (sessionId) formData.append("session_id", sessionId);
      formData.append("image", attachedImage);
      res = await fetch("/api/chat", { method: "POST", body: formData });
    } else {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError(data.error ?? "Chat failed");
      return;
    }
    if (!res.body) { onError("No stream body"); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(part.slice(6));
          if (json.type === "text")        onChunk(json.content);
          if (json.type === "done")        onDone(json.session_id ?? "");
          if (json.type === "error")       onError(json.message ?? "Error");
          if (json.type === "tool_result" && onToolResult) onToolResult(json.name, json.result);
        } catch { /* malformed chunk */ }
      }
    }
  } catch (e) {
    onError((e as Error).message);
  }
}

// ── AI avatar ─────────────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div className="w-7 h-7 shrink-0 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center mt-0.5">
      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
    </div>
  );
}

// ── Score card — Claude-style artifact block with smooth grid expand ───────────

function ScoreCardMsg({ scoreData }: { scoreData: IntentScore }) {
  const [expanded, setExpanded] = useState(false);
  const cfg    = getBandCfg(scoreData.score_band);
  const icpFit = scoreData.icp_fit_score != null ? getIcpCfg(scoreData.icp_fit_score) : null;

  return (
    <div className="ml-10 mt-1 mb-1 animate-slide-up">
      <div className="border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.02] overflow-hidden">

        {/* ── Header — always visible, entire row is the toggle ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full text-left px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.025] transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3">

            {/* Mini score ring */}
            <div className={`p-[3px] rounded-full shrink-0 bg-gradient-to-br ${cfg.ring} ${cfg.pulse}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#030712]">
                <span className={`text-base font-black tracking-tight ${cfg.score}`}>
                  {scoreData.intent_score}
                </span>
              </div>
            </div>

            {/* Company name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {scoreData.company}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{scoreData.domain}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${cfg.badge}`}>
                  {scoreData.score_band}
                </span>
                {icpFit && (scoreData.icp_fit_score ?? 0) > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 border rounded-sm ${icpFit.cls}`}>
                    {icpFit.label} · {scoreData.icp_fit_score}%
                  </span>
                )}
              </div>
            </div>

            {/* Rotating chevron */}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Signal bars — always visible under company info */}
          <div className="mt-3 space-y-1.5" style={{ paddingLeft: "56px" }}>
            {SIGNAL_KEYS.map((key) => {
              const sig = scoreData.signals[key] as { score: number; max: number };
              const pct = (sig.score / sig.max) * 100;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 w-7 shrink-0 font-medium">
                    {SIGNAL_SHORT[key]}
                  </span>
                  <div className="flex-1 h-[3px] bg-slate-200 dark:bg-white/[0.06] overflow-hidden rounded-full">
                    <div
                      className={`h-full bg-gradient-to-r ${SIGNAL_COLORS[key]} transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono w-7 text-right shrink-0">
                    {sig.score}/{sig.max}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Expand hint */}
          <p className="mt-2.5 text-[10px] text-cyan-500/70 dark:text-cyan-500/60 tracking-wide font-medium"
             style={{ paddingLeft: "56px" }}>
            {expanded ? "Collapse full analysis" : "View full analysis"}
          </p>
        </button>

        {/* ── Expandable full analysis — smooth CSS grid height animation ── */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-200 dark:border-white/[0.08]">
              <ScoreResult result={scoreData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Conversation Analysis Card ────────────────────────────────────────────────

function ConversationAnalysisCard({ analysis }: { analysis: ConversationAnalysis }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = getIntentCfg(analysis.overall_intent);
  const companyLabel = analysis.companies.length > 0
    ? analysis.companies.join(", ")
    : "Conversation";

  return (
    <div className="ml-10 mt-1 mb-1 animate-slide-up">
      <div className="border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.02] overflow-hidden">

        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full text-left px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.025] transition-colors duration-150"
        >
          <div className="flex items-center gap-3">
            {/* Intent score ring */}
            <div className={`p-[3px] rounded-full shrink-0 bg-gradient-to-br ${cfg.ring}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#030712]">
                <span className={`text-base font-black tracking-tight ${cfg.score}`}>
                  {analysis.intent_score}
                </span>
              </div>
            </div>

            {/* Company + badge */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block truncate">
                {companyLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${cfg.badge}`}>
                  {analysis.overall_intent}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {analysis.signals.length} signal{analysis.signals.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* Expandable body */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-200 dark:border-white/[0.08] px-4 py-3 space-y-3">

              {/* Signal list */}
              {analysis.signals.length > 0 && (
                <div className="space-y-2.5">
                  {analysis.signals.map((signal, i) => {
                    const Icon = CONV_SIGNAL_ICONS[signal.type] ?? AlertCircle;
                    const label = CONV_SIGNAL_LABELS[signal.type] ?? signal.type;
                    return (
                      <div key={i} className="flex gap-2.5">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
                              {label}
                            </span>
                            <div className="h-[2px] flex-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
                                style={{ width: `${Math.round(signal.confidence * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                              {Math.round(signal.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-[1.5] line-clamp-2">
                            &ldquo;{signal.excerpt}&rdquo;
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {analysis.summary && (
                <div className="pt-2.5 border-t border-slate-200 dark:border-white/[0.06]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-[1.65]">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Recommended action */}
              {analysis.recommended_action && (
                <div className="px-3 py-2.5 bg-cyan-500/5 border border-cyan-500/20">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-500/70 mb-1 font-bold">
                    Recommended Action
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300 leading-[1.6]">
                    {analysis.recommended_action}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat message renderer ─────────────────────────────────────────────────────

function ChatMsg({ msg }: { msg: ChatMessage }) {
  // Score card artifact
  if (msg.role === "score-card" && msg.scoreData) {
    return <ScoreCardMsg scoreData={msg.scoreData} />;
  }

  // Conversation analysis card
  if (msg.role === "conversation-analysis" && msg.conversationAnalysis) {
    return <ConversationAnalysisCard analysis={msg.conversationAnalysis} />;
  }

  // Thinking indicator — avatar + animated dots
  if (msg.role === "indicator") {
    return (
      <div className="flex gap-3 py-4 animate-slide-up">
        <AIAvatar />
        <div className="flex items-center gap-2 pt-[3px]">
          <span className="flex gap-[3px] items-end">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-[5px] w-[5px] rounded-full bg-slate-300 dark:bg-slate-600"
                style={{
                  animation: "thinking-dot 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
          <span className="font-sans text-xs text-slate-400 dark:text-slate-500">{msg.content}</span>
        </div>
      </div>
    );
  }

  // User message — right-aligned pill bubble
  if (msg.role === "user") {
    return (
      <div className="flex justify-end py-2 animate-slide-up">
        <div className="bg-slate-100 dark:bg-white/[0.07] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
          {msg.imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={msg.imagePreview}
              alt="Screenshot"
              className="mb-2 h-16 w-auto max-w-[180px] object-cover rounded-sm border border-slate-200 dark:border-white/[0.12]"
            />
          )}
          {msg.content && (
            <p className="font-sans text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {msg.content}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Assistant — avatar + clean flowing prose
  return (
    <div className="flex gap-3 py-4 animate-slide-up">
      <AIAvatar />
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-sans text-sm text-slate-700 dark:text-slate-300 leading-[1.75] whitespace-pre-wrap">
          {msg.content}
          {msg.streaming && (
            <span className="inline-block w-[2px] h-[14px] ml-px bg-cyan-400 align-middle animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}

// ── Image attachment helpers ──────────────────────────────────────────────────

/** Extract first image File from a DataTransferItemList (paste event) */
function imageFromClipboard(items: DataTransferItemList): File | null {
  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) return item.getAsFile();
  }
  return null;
}

/** Extract first image File from a FileList (drop event) */
function imageFromFileList(files: FileList): File | null {
  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const router       = useRouter();
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const chatEndRef   = useRef<HTMLDivElement>(null);

  const [query,    setQuery]    = useState("");
  const [input,    setInput]    = useState("");

  const [mode,          setMode]          = useState<Mode>("idle");
  const [loadingDomain, setLoadingDomain] = useState("");
  const [error,         setError]         = useState<string | null>(null);

  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [sessionId,  setSessionId]  = useState<string | null>(null);

  // Image attachment state
  const [attachedImage,    setAttachedImage]    = useState<File | null>(null);
  const [imagePreviewUrl,  setImagePreviewUrl]  = useState<string | null>(null);
  const [isDragging,       setIsDragging]       = useState(false);

  const isActive = mode !== "idle";
  const isBusy   = mode === "scoring" || mode === "narrating" || mode === "following-up";

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Revoke blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  // ── Message helpers ──────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    const full = { ...msg, id: uid() };
    setMessages((prev) => [...prev, full]);
    return full.id;
  }, []);

  const replaceIndicatorWithScoreCard = useCallback((scoreData: IntentScore) => {
    setMessages((prev) => {
      let idx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === "indicator") { idx = i; break; }
      }
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], role: "score-card" as const, scoreData, content: "" };
      return updated;
    });
  }, []);

  const updateLastAssistant = useCallback((chunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
    });
  }, []);

  const setLastAssistantDone = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, streaming: false }];
    });
  }, []);

  // ── Image attachment ─────────────────────────────────────────────────────────

  function attachImage(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const url = URL.createObjectURL(file);
    setAttachedImage(file);
    setImagePreviewUrl(url);
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setAttachedImage(null);
    setImagePreviewUrl(null);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (e.clipboardData?.items) {
      const file = imageFromClipboard(e.clipboardData.items);
      if (file) attachImage(file);
    }
  }

  // ── Conversation analysis via image or pasted text ────────────────────────

  const handleImageMessage = useCallback(
    async (message: string, imageFile: File, previewUrl: string) => {
      setError(null);
      setMode("following-up");

      const imagePreview = previewUrl;
      // Clear image state directly using stable state setters (avoids stale closure on clearImage)
      URL.revokeObjectURL(previewUrl);
      setAttachedImage(null);
      setImagePreviewUrl(null);

      addMessage({ role: "user", content: message, imagePreview });
      addMessage({ role: "assistant", content: "", streaming: true });

      await streamChat(
        message,
        sessionId,
        (chunk) => updateLastAssistant(chunk),
        (sid) => { setSessionId(sid); setLastAssistantDone(); setMode("ready"); },
        (err) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, content: err, streaming: false }];
          });
          setMode("ready");
        },
        imageFile,
        (toolName, result) => {
          if (toolName === "analyze_conversation") {
            const analysis = result as ConversationAnalysis;
            setMessages((prev) => {
              const card: ChatMessage = {
                id: uid(),
                role: "conversation-analysis",
                content: "",
                conversationAnalysis: analysis,
              };
              // Insert card before the (still-streaming) last assistant message
              const lastIdx = prev.length - 1;
              if (prev[lastIdx]?.role === "assistant") {
                return [...prev.slice(0, lastIdx), card, prev[lastIdx]];
              }
              return [...prev, card];
            });
          }
        }
      );
    },
    [sessionId, addMessage, updateLastAssistant, setLastAssistantDone]
  );

  // ── Narration after scoring ──────────────────────────────────────────────────

  const runNarration = useCallback(
    async (scoreResult: IntentScore) => {
      replaceIndicatorWithScoreCard(scoreResult);
      addMessage({ role: "assistant", content: "", streaming: true });
      setMode("narrating");

      await streamChat(
        buildNarrationPrompt(scoreResult),
        null,
        (chunk) => updateLastAssistant(chunk),
        (sid) => { setSessionId(sid); setLastAssistantDone(); setMode("ready"); },
        (err) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== "assistant") return prev;
            return [...prev.slice(0, -1), { ...last, content: err, streaming: false }];
          });
          setMode("ready");
        }
      );
    },
    [replaceIndicatorWithScoreCard, addMessage, updateLastAssistant, setLastAssistantDone]
  );

  // ── Score a domain ───────────────────────────────────────────────────────────

  async function handleAnalyze(rawQuery?: string) {
    const q = (rawQuery ?? query).trim();

    // If image is attached, route to conversation analysis regardless of text
    if (attachedImage && imagePreviewUrl) {
      await handleImageMessage(
        q || "Analyze this conversation for buying intent signals.",
        attachedImage,
        imagePreviewUrl
      );
      return;
    }

    if (!q) return;
    if (q === "watchlist" || q.toLowerCase().includes("watchlist")) { router.push("/watchlist"); return; }
    if (q === "bulk") { router.push("/bulk"); return; }
    if (q.toLowerCase().includes("hot companies") || q.toLowerCase().includes("hot leads")) { router.push("/watchlist"); return; }

    const domain = extractDomain(q);
    if (!domain) { setError("Please enter a domain like acme.com"); return; }

    setError(null);
    setMessages([]);
    setSessionId(null);
    setLoadingDomain(domain);
    setMode("scoring");

    addMessage({ role: "user",      content: domain });
    addMessage({ role: "indicator", content: `Analyzing ${domain}…` });

    try {
      const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(domain)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Scoring failed");
      }
      const data: IntentScore = await res.json();
      await runNarration(data);
    } catch (e) {
      setError((e as Error).message);
      setMode("ready");
    }
  }

  // ── Unified bottom input — scores OR follows up OR analyzes image ─────────

  async function handleUnifiedSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (isBusy) return;

    // Image analysis takes priority
    if (attachedImage && imagePreviewUrl) {
      setInput("");
      await handleImageMessage(
        text || "Analyze this conversation for buying intent signals.",
        attachedImage,
        imagePreviewUrl
      );
      return;
    }

    if (!text) return;
    setInput("");

    // Detect a score intent: starts with "score " or is just a bare domain
    const startsWithScore = /^score\s+/i.test(text);
    const bareIsDomain    = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(text);

    if ((startsWithScore || bareIsDomain) && extractDomain(text)) {
      await handleAnalyze(text);
      return;
    }

    // Otherwise — follow-up chat message (requires a session)
    if (!sessionId) return;

    addMessage({ role: "user",      content: text });
    addMessage({ role: "assistant", content: "", streaming: true });
    setMode("following-up");

    await streamChat(
      text,
      sessionId,
      (chunk) => updateLastAssistant(chunk),
      () => { setLastAssistantDone(); setMode("ready"); },
      (err) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return prev;
          return [...prev.slice(0, -1), { ...last, content: err, streaming: false }];
        });
        setMode("ready");
      }
    );
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUnifiedSend(); }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // ── Idle — centered hero ───────────────────────────────────────────────────

  if (!isActive) {
    const hasImage = !!attachedImage && !!imagePreviewUrl;
    return (
      <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 w-full">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-bold">Intent IQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            What do you want to know?
          </h1>
          <p className="text-slate-500 text-sm mt-3 tracking-wide">
            {hasImage
              ? "Screenshot attached — send to extract buying intent signals"
              : "Score a company, query your watchlist, or paste a conversation screenshot."}
          </p>
        </div>

        <div
          className={`w-full max-w-[680px] border bg-white dark:bg-white/[0.03] focus-within:border-cyan-500/50 transition-colors ${
            isDragging
              ? "border-cyan-500/50 bg-cyan-500/5"
              : "border-slate-200 dark:border-white/[0.10]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) {
              const file = imageFromFileList(e.dataTransfer.files); if (file) attachImage(file);
            }
          }}
        >
          {/* Image thumbnail */}
          {hasImage && (
            <div className="px-4 pt-3 pb-1 flex items-start gap-2">
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl!}
                  alt="Screenshot"
                  className="h-12 w-12 object-cover border border-slate-200 dark:border-white/[0.12] rounded-sm"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Remove screenshot"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
              <p className="font-sans text-xs text-slate-400 dark:text-slate-500 pt-1">
                Ready to analyze for intent signals
              </p>
            </div>
          )}

          <textarea
            ref={mainInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalyze(); } }}
            onPaste={handlePaste}
            placeholder={hasImage
              ? "Ask about this conversation or press Analyze…"
              : "score acme.com — or paste a conversation screenshot to analyze intent…"}
            rows={2}
            className="w-full px-4 pt-4 pb-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-transparent resize-none outline-none"
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs text-slate-400 tracking-wide">Shift+Enter for new line · Ctrl+V to paste screenshot</span>
            <button
              onClick={() => handleAnalyze()}
              disabled={!query.trim() && !hasImage}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-[0.08em] bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            >
              {hasImage ? "Analyze Conversation" : "Analyze"} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleAnalyze(chip.query)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-cyan-500/40 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/5 transition-all cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Active — Claude-style chat thread ─────────────────────────────────────

  const hasImage = !!attachedImage && !!imagePreviewUrl;

  return (
    <div
      className="max-w-[680px] mx-auto w-full flex flex-col"
      style={{ minHeight: "calc(100vh - 140px)" }}
    >
      {/* ── Thread ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-1 pb-4">

        {error && (
          <p className="mt-4 text-sm text-red-400 font-sans">{error}</p>
        )}

        {messages.map((msg) => (
          <ChatMsg key={msg.id} msg={msg} />
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* ── Unified bottom input ── */}
      <div className="shrink-0 pt-4 border-t border-slate-200 dark:border-white/[0.10]">
        {mode === "ready" ? (
          <form onSubmit={handleUnifiedSend}>
            <div
              className={`flex flex-col bg-white dark:bg-white/[0.03] border transition-colors ${
                isDragging
                  ? "border-cyan-500/50 bg-cyan-500/5"
                  : "border-slate-200 dark:border-white/[0.12] focus-within:border-cyan-500/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length > 0) {
                  const file = imageFromFileList(e.dataTransfer.files); if (file) attachImage(file);
                }
              }}
            >
              {/* Image thumbnail above textarea */}
              {hasImage && (
                <div className="px-4 pt-3 pb-1 flex items-start gap-2">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreviewUrl!}
                      alt="Screenshot"
                      className="h-12 w-12 object-cover border border-slate-200 dark:border-white/[0.12] rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Remove screenshot"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                  <p className="font-sans text-xs text-slate-400 dark:text-slate-500 pt-1">
                    Screenshot attached — will analyze for intent signals
                  </p>
                </div>
              )}

              <div className="flex items-end gap-2 px-4 py-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  onPaste={handlePaste}
                  placeholder={hasImage
                    ? "Add context or just press send…"
                    : "Ask a follow-up, or type a domain to score…"}
                  rows={1}
                  className="font-sans flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none leading-[1.6] max-h-[160px] overflow-y-auto scrollbar-thin"
                  style={{ height: "24px" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() && !hasImage}
                  aria-label="Send"
                  className="shrink-0 w-8 h-8 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer rounded-sm"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="font-sans text-[10px] text-slate-400 dark:text-slate-600 mt-1.5 text-center tracking-wide">
              {hasImage
                ? "1 credit · Ctrl+V to paste screenshot · Enter to send"
                : "0.25 credits per follow-up · Ctrl+V to paste screenshot · Enter to send"}
            </p>
          </form>
        ) : (
          /* Busy state — subtle status row */
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="flex gap-[3px] items-end">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-[5px] w-[5px] rounded-full bg-cyan-400"
                  style={{ animation: "thinking-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </span>
            <span className="font-sans text-xs text-slate-400 dark:text-slate-500 tracking-wide">
              {mode === "scoring"
                ? `Scoring ${loadingDomain}…`
                : mode === "narrating"
                ? "Generating analysis…"
                : "Analyzing…"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
