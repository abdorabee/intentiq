"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { IntentScore, ScoreBand } from "@/lib/types";
import { CHAT_CREDIT_COST } from "@/lib/types";
import {
  extractDomain,
  isAbortError,
  LAST_CHAT_SESSION_KEY,
  listChatSessions,
  loadChatSession,
  NEW_CHAT_FLAG_KEY,
  seedChatSession,
  streamChat,
  type PersistedChatMessage,
} from "@/lib/chat-client";
import { avColor } from "@/components/score/score-result-card";
import { confirmationKeyFor, GenUiWorkspace, SuggestionChips } from "@/components/score/gen-ui/workspace";
import {
  blocksFromToolResult,
  sanitizeUiBlocks,
  suggestionsFromBlocks,
  workspaceFromScore,
} from "@/lib/gen-ui";
import type { ConfirmationBlock, UiBlock } from "@/lib/gen-ui";

type ScorableIntentScore = IntentScore & {
  intent_score: number;
  score_band: ScoreBand;
};

function requireScorableResult(value: IntentScore): ScorableIntentScore {
  if (value.intent_score === null || value.score_band === null || value.score_status === "unscorable") {
    throw new Error("Not enough current evidence to calculate a reliable score.");
  }
  return value as ScorableIntentScore;
}

async function requestScore(domain: string, signal?: AbortSignal): Promise<ScorableIntentScore> {
  const response = await fetch("/api/v1/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
    signal,
  });
  const payload = await response.json() as IntentScore & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Scoring failed");
  return requireScorableResult(payload);
}

export interface RecentScore {
  domain: string;
  company_name: string;
  score: number | null;
  score_band: "HOT" | "WARM" | "COLD" | null;
  created_at: string;
}

interface ScoreViewProps {
  creditsRemaining: number;
  recentScores: RecentScore[];
}

type ToolChip = {
  name: string;
  status: "running" | "done";
  result?: unknown;
};

type ThreadMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; kind: "ui"; blocks: UiBlock[]; content: string; tools: ToolChip[]; billing?: string }
  | { id: string; role: "assistant"; kind: "text"; content: string; tools: ToolChip[] }
  | { id: string; role: "assistant"; kind: "thinking"; mode: "score" | "chat" }
  | { id: string; role: "error"; content: string; tools: ToolChip[] };

type ConfirmationStatus = "pending" | "confirming" | "confirmed" | "cancelled" | "error";

function messageTools(message: ThreadMessage): ToolChip[] {
  if (message.role === "error") return message.tools;
  return message.role === "assistant" && (message.kind === "text" || message.kind === "ui") ? message.tools : [];
}

function nextId(): string {
  return crypto.randomUUID();
}

function billingLabel(result: ScorableIntentScore & { charged?: boolean; cached?: boolean }): string {
  if ("charged" in result && result.charged) return "1 credit";
  if ("cached" in result && result.cached) return "cache hit · free";
  return "no credit charged";
}

const STEPS = ["Domain resolved", "Funding signal", "Hiring + news", "Technology trigger", "Web + GitHub context", "AI thesis"];

function rememberSession(id: string) {
  try { localStorage.setItem(LAST_CHAT_SESSION_KEY, id); } catch { /* private mode */ }
}

function toolsFromPersisted(toolCalls: unknown, toolResult: unknown): ToolChip[] {
  const calls = Array.isArray(toolCalls) ? toolCalls : [];
  const results = Array.isArray(toolResult) ? toolResult : [];
  return calls.flatMap((call, index) => {
    const row = call && typeof call === "object" ? call as Record<string, unknown> : null;
    const name = typeof row?.name === "string" ? row.name : null;
    if (!name) return [];
    const match = results.find((item) => item && typeof item === "object" && (item as { name?: string }).name === name)
      ?? results[index];
    const result = match && typeof match === "object" && "result" in match
      ? (match as { result: unknown }).result
      : undefined;
    return [{ name, status: "done" as const, result }];
  });
}

function threadFromPersisted(messages: PersistedChatMessage[]): ThreadMessage[] {
  const out: ThreadMessage[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      out.push({ id: message.id, role: "user", content: message.content });
      continue;
    }
    if (message.role !== "assistant") continue;
    const tools = toolsFromPersisted(message.tool_calls, message.tool_result);
    const blocks = sanitizeUiBlocks(message.ui_blocks);
    if (blocks.length > 0) {
      out.push({
        id: message.id,
        role: "assistant",
        kind: "ui",
        blocks,
        content: message.content ?? "",
        tools,
      });
      continue;
    }
    out.push({
      id: message.id,
      role: "assistant",
      kind: "text",
      content: message.content ?? "",
      tools,
    });
  }
  return out;
}

function LiveProgressBar({
  loading,
  stepIndex,
  billingLabel: label,
}: {
  loading: boolean;
  stepIndex: number;
  billingLabel?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(parseFloat(((Date.now() - start) / 1000).toFixed(2))), 100);
    return () => clearInterval(t);
  }, [loading]);

  return (
    <div className="live-progress">
      <span className="pulse" />
      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={i} className={`step ${i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}`}>
            <span className="check">
              {i < stepIndex && (
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" width="7" height="7">
                  <path d="M2 5l2 2 4-4" />
                </svg>
              )}
              {i === stepIndex && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "block" }} />
              )}
            </span>
            {s}
          </span>
        ))}
      </div>
      {!loading && label && <span className="timing">{elapsed}s · {label}</span>}
    </div>
  );
}

function ToolChips({ tools }: { tools: ToolChip[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="chat-tools">
      {tools.map((tool) => (
        <div key={tool.name} className={`chat-tool ${tool.status}`}>
          <span className="chat-tool-dot" />
          {tool.status === "running" ? `Running ${tool.name.replace(/_/g, " ")}…` : tool.name.replace(/_/g, " ")}
        </div>
      ))}
    </div>
  );
}

function AssistantText({ content }: { content: string }) {
  return <div className="chat-md">{content}</div>;
}

function AttachControl({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onFile(next && next.size > 0 ? next : null);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="prompt-attach"
        disabled={disabled}
        aria-label={file ? `Attached ${file.name}` : "Attach image"}
        title={file ? file.name : "Attach image"}
        onClick={() => inputRef.current?.click()}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" aria-hidden>
          <path d="M4.5 6.5l3.2-3.2a2.2 2.2 0 013.1 3.1L6 11a1.6 1.6 0 01-2.3-2.3l4.2-4.2" />
        </svg>
      </button>
    </>
  );
}

interface ScorePromptStageProps {
  domain: string;
  setDomain: (v: string) => void;
  onScore: () => void;
  onStop: () => void;
  creditsRemaining: number;
  recentScores: RecentScore[];
  busy: boolean;
  image: File | null;
  onImage: (file: File | null) => void;
}

function ScorePromptStage({
  domain,
  setDomain,
  onScore,
  onStop,
  creditsRemaining,
  recentScores,
  busy,
  image,
  onImage,
}: ScorePromptStageProps) {
  return (
    <div className="prompt-stage">
      <div className="prompt-inner" data-tour="score-workspace">
        <div className="prompt-holder prompt-holder--compact prompt-holder--with-attach" data-tour="score-composer">
          <div className="prompt-prefix">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
              <circle cx="7" cy="7" r="5" /><path d="M2 7h10M7 2c2 2 2 8 0 10M7 2c-2 2-2 8 0 10" />
            </svg>
          </div>
          <input
            className="prompt-input"
            type="text"
            placeholder="stripe.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && onScore()}
            autoFocus
            disabled={busy}
            aria-label="Company domain"
          />
          <AttachControl file={image} onFile={onImage} disabled={busy} />
          {busy ? (
            <button type="button" className="tb-btn outlined" onClick={onStop}>Stop</button>
          ) : (
            <button type="button" className="prompt-go" onClick={onScore} disabled={!domain.trim() && !image}>
              Score
              <span className="kbd-inline">↵</span>
            </button>
          )}
        </div>

        <div className="prompt-meta">
          <span>
            1 credit to score · follow-ups {CHAT_CREDIT_COST} · {creditsRemaining} left
          </span>
        </div>
        {image && (
          <div className="chat-file">
            <span>{image.name}</span>
            <button type="button" className="chat-new" onClick={() => onImage(null)}>Remove</button>
          </div>
        )}

        {recentScores.length > 0 && (
          <>
            <div className="prompt-section-label">
              <span>Recent</span>
              <span className="line" />
            </div>
            <div className="recent-row">
              {recentScores.map((r) => (
                <button key={r.domain} type="button" className="sugg recent" onClick={() => setDomain(r.domain)}>
                  <div className="av" style={{ background: avColor(r.company_name) }}>{r.company_name[0]}</div>
                  {r.domain}
                  <span
                    className="score-mini"
                    style={{
                      background:
                        r.score_band === "HOT"
                          ? "var(--hot-bg)"
                          : r.score_band === "WARM"
                          ? "var(--warm-bg)"
                          : "var(--cold-bg)",
                      color:
                        r.score_band === "HOT"
                          ? "var(--hot)"
                          : r.score_band === "WARM"
                          ? "var(--warm)"
                          : "var(--cold)",
                    }}
                  >
                    {r.score ?? "—"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ScoreView({ creditsRemaining, recentScores }: ScoreViewProps) {
  const searchParams = useSearchParams();
  const autoScoredRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastTurnRef = useRef<{ text: string; image: File | null } | null>(null);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [watchlistByDomain, setWatchlistByDomain] = useState<Record<string, "adding" | "added">>({});
  const [confirmationByKey, setConfirmationByKey] = useState<Record<string, ConfirmationStatus>>({});
  const scoring = busy && messages.some((m) => m.role === "assistant" && m.kind === "thinking" && m.mode === "score");

  useEffect(() => {
    const d = searchParams.get("domain")?.trim();
    if (!d) return;
    setInput(d);
    if (autoScoredRef.current === d) return;
    autoScoredRef.current = d;
    void submitMessage(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (restoredRef.current) return;
    if (searchParams.get("domain")?.trim()) {
      restoredRef.current = true;
      return;
    }
    restoredRef.current = true;
    let cancelled = false;
    async function restore() {
      try {
        if (sessionStorage.getItem(NEW_CHAT_FLAG_KEY) === "1") {
          sessionStorage.removeItem(NEW_CHAT_FLAG_KEY);
          return;
        }
      } catch { /* private mode */ }
      let id: string | null = null;
      try { id = localStorage.getItem(LAST_CHAT_SESSION_KEY); } catch { /* private mode */ }
      try {
        if (!id) {
          const sessions = await listChatSessions();
          id = sessions[0]?.id ?? null;
        }
        if (!id || cancelled) return;
        const loaded = await loadChatSession(id);
        if (cancelled) return;
        const thread = threadFromPersisted(loaded.messages);
        if (thread.length === 0) return;
        setSessionId(loaded.session.id);
        setMessages(thread);
        rememberSession(loaded.session.id);
      } catch {
        // Stay on the empty state if the last session cannot be loaded.
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    if (!scoring) { setStepIndex(0); return; }
    setStepIndex(0);
    const t = setInterval(() => {
      setStepIndex((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 430);
    return () => clearInterval(t);
  }, [scoring]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function beginRequest(): AbortController {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  async function runScore(raw: string, domain: string) {
    const thinkingId = nextId();
    const controller = beginRequest();
    lastTurnRef.current = { text: raw, image: null };
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: raw },
      { id: thinkingId, role: "assistant", kind: "thinking", mode: "score" },
    ]);
    setBusy(true);
    try {
      const payload = await requestScore(domain, controller.signal);
      const blocks = workspaceFromScore(payload);
      setMessages((prev) => prev.map((m) => (
        m.id === thinkingId
          ? {
              id: thinkingId,
              role: "assistant",
              kind: "ui",
              blocks,
              content: "",
              tools: [],
              billing: billingLabel(payload),
            }
          : m
      )));
      try {
        const id = await seedChatSession({
          sessionId: sessionId ?? undefined,
          title: payload.domain,
          user: `Score ${payload.domain}`,
          assistant: payload.ai_summary || `${payload.company} scored ${payload.intent_score}/100 (${payload.score_band}).`,
          ui_blocks: blocks,
        });
        setSessionId(id);
        rememberSession(id);
      } catch {
        // Follow-ups can still create a session on first chat turn.
      }
    } catch (e) {
      if (isAbortError(e)) {
        setMessages((prev) => prev.map((m) => (
          m.id === thinkingId
            ? { id: thinkingId, role: "error", content: "Stopped", tools: [] }
            : m
        )));
        return;
      }
      setMessages((prev) => prev.map((m) => (
        m.id === thinkingId
          ? { id: thinkingId, role: "error", content: (e as Error).message, tools: [] }
          : m
      )));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  async function runFollowUp(text: string, attachment: File | null) {
    const thinkingId = nextId();
    const controller = beginRequest();
    lastTurnRef.current = { text, image: attachment };
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: attachment ? `${text || "Analyze this screenshot"} · ${attachment.name}` : text },
      { id: thinkingId, role: "assistant", kind: "thinking", mode: "chat" },
    ]);
    setBusy(true);
    try {
      const nextSession = await streamChat(
        {
          message: text || (attachment ? "Analyze this conversation screenshot for buying intent signals." : ""),
          session_id: sessionId ?? undefined,
          image: attachment ?? undefined,
        },
        (event) => {
          setMessages((prev) => {
            const current = prev.find((m) => m.id === thinkingId);
            if (!current) return prev;
            if (event.type === "error") {
              return prev.map((m) => (
                m.id === thinkingId
                  ? { id: thinkingId, role: "error", content: event.message, tools: messageTools(current) }
                  : m
              ));
            }
            if (event.type === "text") {
              if (current.role === "assistant" && current.kind === "ui") {
                return prev.map((m) => (m.id === thinkingId ? { ...current, content: current.content + event.content } : m));
              }
              const next: ThreadMessage = current.role === "assistant" && current.kind === "text"
                ? { ...current, content: current.content + event.content }
                : { id: thinkingId, role: "assistant", kind: "text", content: event.content, tools: messageTools(current) };
              return prev.map((m) => (m.id === thinkingId ? next : m));
            }
            if (event.type === "ui") {
              const blocks = sanitizeUiBlocks(event.blocks);
              if (blocks.length === 0) return prev;
              const next: ThreadMessage = {
                id: thinkingId,
                role: "assistant",
                kind: "ui",
                blocks,
                content: current.role === "assistant" && "content" in current ? current.content : "",
                tools: messageTools(current),
              };
              return prev.map((m) => (m.id === thinkingId ? next : m));
            }
            if (event.type === "tool_call") {
              const tools: ToolChip[] = [...messageTools(current), { name: event.name, status: "running" }];
              if (current.role === "assistant" && (current.kind === "text" || current.kind === "ui")) {
                return prev.map((m) => (m.id === thinkingId ? { ...current, tools } : m));
              }
              return prev.map((m) => (
                m.id === thinkingId
                  ? { id: thinkingId, role: "assistant", kind: "text", content: "", tools }
                  : m
              ));
            }
            if (event.type === "tool_result") {
              const tools: ToolChip[] = messageTools(current).map((t) => (
                t.name === event.name && t.status === "running" ? { ...t, status: "done", result: event.result } : t
              ));
              const mapped = blocksFromToolResult(event.name, event.result);
              if (current.role === "assistant" && current.kind === "ui") {
                const blocks = current.blocks.length > 0 ? current.blocks : mapped;
                return prev.map((m) => (m.id === thinkingId ? { ...current, tools, blocks } : m));
              }
              if (mapped.length > 0) {
                const next: ThreadMessage = {
                  id: thinkingId,
                  role: "assistant",
                  kind: "ui",
                  blocks: mapped,
                  content: current.role === "assistant" && "content" in current ? current.content : "",
                  tools,
                };
                return prev.map((m) => (m.id === thinkingId ? next : m));
              }
              const base: ThreadMessage = current.role === "assistant" && current.kind === "text"
                ? { ...current, tools }
                : { id: thinkingId, role: "assistant", kind: "text", content: "", tools };
              return prev.map((m) => (m.id === thinkingId ? base : m));
            }
            return prev;
          });
        },
        { signal: controller.signal },
      );
      if (nextSession) {
        setSessionId(nextSession);
        rememberSession(nextSession);
      }
      setMessages((prev) => {
        const current = prev.find((m) => m.id === thinkingId);
        if (current && current.role === "assistant" && current.kind === "thinking") {
          return prev.map((m) => (
            m.id === thinkingId
              ? { id: thinkingId, role: "assistant", kind: "text", content: "", tools: [] }
              : m
          ));
        }
        return prev;
      });
    } catch (e) {
      const stopped = isAbortError(e);
      setMessages((prev) => prev.map((m) => {
        if (m.id !== thinkingId) return m;
        if (m.role === "error") return m;
        if (stopped && m.role === "assistant" && (m.kind === "text" || m.kind === "ui")) {
          const hasBody = m.kind === "ui" ? m.blocks.length > 0 || Boolean(m.content) : Boolean(m.content);
          if (hasBody) return m;
        }
        return {
          id: thinkingId,
          role: "error",
          content: stopped ? "Stopped" : (e as Error).message,
          tools: messageTools(m),
        };
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  async function submitMessage(rawInput?: string, attachment?: File | null) {
    const raw = (rawInput ?? input).trim();
    const file = attachment === undefined ? image : attachment;
    if ((!raw && !file) || busy) return;
    setInput("");
    setImage(null);
    if (file) {
      await runFollowUp(raw, file);
      return;
    }
    const domain = extractDomain(raw);
    if (domain) {
      await runScore(raw, domain);
      return;
    }
    await runFollowUp(raw, null);
  }

  async function retryLastTurn() {
    const last = lastTurnRef.current;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (busy || (!last && !lastUser)) return;
    setMessages((prev) => {
      const idx = [...prev].map((m) => m.role).lastIndexOf("user");
      return idx === -1 ? prev : prev.slice(0, idx);
    });
    await submitMessage(last?.text ?? lastUser?.content ?? "", last?.image ?? null);
  }

  async function handleAddToWatchlist(company: string, domain: string) {
    setWatchlistByDomain((prev) => ({ ...prev, [domain]: "adding" }));
    try {
      const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, company_name: company }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWatchlistByDomain((prev) => ({ ...prev, [domain]: "added" }));
    } catch {
      setWatchlistByDomain((prev) => {
        const next = { ...prev };
        delete next[domain];
        return next;
      });
    }
  }

  function setConfirmation(block: ConfirmationBlock, status: ConfirmationStatus) {
    const key = confirmationKeyFor(block);
    setConfirmationByKey((prev) => ({ ...prev, [key]: status }));
    if (status === "confirming") return;
    const persisted = status;
    setMessages((prev) => prev.map((m) => {
      if (m.role !== "assistant" || m.kind !== "ui") return m;
      return {
        ...m,
        blocks: m.blocks.map((b) => (
          b.type === "confirmation" && confirmationKeyFor(b) === key ? { ...b, status: persisted } : b
        )),
      };
    }));
  }

  async function handleConfirm(block: ConfirmationBlock) {
    setConfirmation(block, "confirming");
    try {
      if (block.action === "add_to_watchlist") {
        const res = await fetch("/api/dashboard/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: block.domain, company_name: block.company ?? block.domain }),
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to add");
        setWatchlistByDomain((prev) => ({ ...prev, [block.domain]: "added" }));
      } else {
        const res = await fetch("/api/dashboard/pipeline/stages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: block.domain, stage: block.stage }),
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to update stage");
      }
      setConfirmation(block, "confirmed");
    } catch {
      setConfirmation(block, "error");
    }
  }

  function handleNewChat() {
    if (busy) return;
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setInput("");
    setImage(null);
    autoScoredRef.current = null;
    lastTurnRef.current = null;
    try {
      sessionStorage.setItem(NEW_CHAT_FLAG_KEY, "1");
      localStorage.removeItem(LAST_CHAT_SESSION_KEY);
    } catch { /* private mode */ }
  }

  const active = messages.length > 0;
  const lastUi = [...messages].reverse().find((m) => m.role === "assistant" && m.kind === "ui");
  const chips = lastUi && lastUi.kind === "ui" ? suggestionsFromBlocks(lastUi.blocks) : [];
  const canRetry = !busy && Boolean(lastTurnRef.current || messages.some((m) => m.role === "user"));

  return (
    <div className="score-chat">
      {!active ? (
        <ScorePromptStage
          domain={input}
          setDomain={setInput}
          onScore={() => void submitMessage()}
          onStop={stopGeneration}
          creditsRemaining={creditsRemaining}
          recentScores={recentScores}
          busy={busy}
          image={image}
          onImage={setImage}
        />
      ) : (
        <>
          <div className="score-chat-thread" ref={threadRef} data-tour="score-workspace">
            <div className="score-chat-col">
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="chat-row user">
                      <div className="chat-bubble user">{message.content}</div>
                    </div>
                  );
                }
                if (message.role === "error") {
                  return (
                    <div key={message.id} className="chat-row assistant">
                      <ToolChips tools={message.tools} />
                      <p className="chat-error" role="alert">{message.content}</p>
                      <button
                        type="button"
                        className="tb-btn outlined"
                        onClick={() => void retryLastTurn()}
                        disabled={busy}
                      >
                        Retry
                      </button>
                    </div>
                  );
                }
                if (message.kind === "thinking") {
                  return (
                    <div key={message.id} className="chat-row assistant">
                      {message.mode === "score" ? (
                        <LiveProgressBar loading stepIndex={stepIndex} />
                      ) : (
                        <div className="chat-thinking">
                          <span className="pulse" />
                          Working…
                        </div>
                      )}
                    </div>
                  );
                }
                if (message.kind === "ui") {
                  return (
                    <div
                      key={message.id}
                      className="chat-row assistant"
                      data-tour={message.id === lastUi?.id ? "score-result" : undefined}
                    >
                      {message.billing && (
                        <LiveProgressBar
                          loading={false}
                          stepIndex={STEPS.length - 1}
                          billingLabel={message.billing}
                        />
                      )}
                      <ToolChips tools={message.tools} />
                      {message.content && <AssistantText content={message.content} />}
                      <GenUiWorkspace
                        blocks={message.blocks}
                        handlers={{
                          onWatchlist: (company, d) => void handleAddToWatchlist(company, d),
                          watchlistByDomain,
                          onPrompt: (prompt) => void submitMessage(prompt),
                          onConfirm: (block) => void handleConfirm(block),
                          onCancel: (block) => setConfirmation(block, "cancelled"),
                          confirmationByKey,
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <div key={message.id} className="chat-row assistant">
                    <ToolChips tools={message.tools} />
                    {message.content && <AssistantText content={message.content} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="score-chat-composer" data-tour="score-composer">
            <SuggestionChips suggestions={chips} onPrompt={(prompt) => void submitMessage(prompt)} disabled={busy} />
            <div className="prompt-holder prompt-holder--compact prompt-holder--with-attach">
              <div className="prompt-prefix">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                  <circle cx="7" cy="7" r="5" /><path d="M2 7h10M7 2c2 2 2 8 0 10M7 2c-2 2-2 8 0 10" />
                </svg>
              </div>
              <input
                className="prompt-input"
                type="text"
                placeholder="Ask a follow-up or score another domain"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !busy) void submitMessage();
                  if (e.key === "Escape" && busy) stopGeneration();
                }}
                disabled={busy}
                aria-label="Chat message"
              />
              <AttachControl file={image} onFile={setImage} disabled={busy} />
              {busy ? (
                <button type="button" className="tb-btn outlined" onClick={stopGeneration}>Stop</button>
              ) : (
                <button type="button" className="prompt-go" onClick={() => void submitMessage()} disabled={!input.trim() && !image}>
                  Send
                </button>
              )}
            </div>
            {image && (
              <div className="chat-file">
                <span>{image.name}</span>
                <button type="button" className="chat-new" onClick={() => setImage(null)}>Remove</button>
              </div>
            )}
            <div className="prompt-meta">
              <div className="left">
                <span>Follow-ups <strong>{CHAT_CREDIT_COST}</strong> credits · new domain <strong>1</strong> credit</span>
              </div>
              <div className="right">
                <button type="button" className="chat-new" onClick={() => void retryLastTurn()} disabled={!canRetry}>
                  Retry
                </button>
                <button type="button" className="chat-new" onClick={handleNewChat} disabled={busy}>
                  New conversation
                </button>
                <span><strong>{creditsRemaining}</strong> credits left</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
