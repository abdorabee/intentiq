"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { IntentScore, ScoreBand } from "@/lib/types";
import { CHAT_CREDIT_COST } from "@/lib/types";
import { extractDomain, seedChatSession, streamChat } from "@/lib/chat-client";
import { avColor, ScoreResultCard, scoreFromToolResult } from "@/components/score/score-result-card";
import type { ScoreCardData } from "@/components/score/score-result-card";

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

async function requestScore(domain: string): Promise<ScorableIntentScore> {
  const response = await fetch("/api/v1/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
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

const HOT_PICKS = [
  { domain: "stripe.com",     name: "Stripe",      signal: "funding" },
  { domain: "anthropic.com",  name: "Anthropic",   signal: "news" },
  { domain: "linear.app",     name: "Linear",      signal: "hiring" },
  { domain: "notion.so",      name: "Notion",      signal: "news" },
  { domain: "databricks.com", name: "Databricks",  signal: "tech" },
];

type ToolChip = {
  name: string;
  status: "running" | "done";
  result?: unknown;
};

type ThreadMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; kind: "score"; result: ScoreCardData }
  | { id: string; role: "assistant"; kind: "text"; content: string; tools: ToolChip[] }
  | { id: string; role: "assistant"; kind: "thinking"; mode: "score" | "chat" }
  | { id: string; role: "error"; content: string };

function messageTools(message: ThreadMessage): ToolChip[] {
  return message.role === "assistant" && message.kind === "text" ? message.tools : [];
}

function nextId(): string {
  return crypto.randomUUID();
}

function billingLabel(result: ScoreCardData & { charged?: boolean; cached?: boolean }): string {
  if ("charged" in result && result.charged) return "1 credit";
  if ("cached" in result && result.cached) return "cache hit · free";
  return "no credit charged";
}

const STEPS = ["Domain resolved", "Funding signal", "Hiring + news", "Technology trigger", "Web + GitHub context", "AI thesis"];

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

interface ScorePromptStageProps {
  domain: string;
  setDomain: (v: string) => void;
  onScore: () => void;
  creditsRemaining: number;
  recentScores: RecentScore[];
  busy: boolean;
}

function ScorePromptStage({ domain, setDomain, onScore, creditsRemaining, recentScores, busy }: ScorePromptStageProps) {
  return (
    <div className="prompt-stage">
      <div className="prompt-bg">
        <div className="grid" />
      </div>
      <div className="prompt-inner">
        <div className="prompt-eyebrow">
          <span className="badge">Score</span>
          Drop in a domain — we&apos;ll verify coverage and you can ask follow-ups
        </div>

        <h1 className="prompt-h1">
          What account do you want to{" "}
          <span className="grad">score</span>?
        </h1>
        <p className="prompt-sub">
          Paste any company domain. Four dated purchase triggers drive the score;
          then keep chatting about the account.
        </p>

        <div className="prompt-holder prompt-holder--compact">
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
          />
          <button type="button" className="prompt-go" onClick={onScore} disabled={busy}>
            Score
            <span className="kbd-inline">↵</span>
          </button>
        </div>

        <div className="prompt-meta">
          <div className="left">
            <span><strong>1</strong> credit on a fresh scorable result · follow-ups {CHAT_CREDIT_COST} credits</span>
            <span>Cached for <strong>6h</strong></span>
          </div>
          <div className="right">
            <span>Provider calls are bounded</span>
            <span><strong>{creditsRemaining}</strong> credits left</span>
          </div>
        </div>

        <div className="prompt-section-label">
          <span>Try a hot pick</span>
          <span className="line" />
        </div>
        <div className="suggestion-row">
          {HOT_PICKS.map((pick) => (
            <button key={pick.domain} type="button" className="sugg" onClick={() => setDomain(pick.domain)}>
              <div className="av" style={{ background: avColor(pick.name) }}>{pick.name[0]}</div>
              {pick.domain}
              <span className="mono-sm">▲ {pick.signal}</span>
            </button>
          ))}
        </div>

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

        <div className="prompt-feature-row">
          <div className="feat">
            <span className="ic" style={{ background: "rgba(223,255,0,0.12)", color: "var(--cyan)" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <path d="M2 8l3-3 2 2 3-4" />
              </svg>
            </span>
            4 trigger axes
          </div>
          <div className="feat">
            <span className="ic" style={{ background: "rgba(223,255,0,0.12)", color: "#dfff00" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <circle cx="6" cy="6" r="4" /><path d="M6 4v3l2 1" />
              </svg>
            </span>
            Interactive chat
          </div>
          <div className="feat">
            <span className="ic" style={{ background: "rgba(74,222,128,0.12)", color: "var(--hot)" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <path d="M2 9V5m3 4V3m3 6V6" />
              </svg>
            </span>
            Signal breakdown · 4 triggers + context
          </div>
          <div className="feat">
            <span className="ic" style={{ background: "rgba(245,181,68,0.12)", color: "var(--warm)" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <path d="M3 6l3 3 5-7" />
              </svg>
            </span>
            Recommended next action
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoreView({ creditsRemaining, recentScores }: ScoreViewProps) {
  const searchParams = useSearchParams();
  const autoScoredRef = useRef<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [watchlistByDomain, setWatchlistByDomain] = useState<Record<string, "adding" | "added">>({});
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
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

  async function runScore(raw: string, domain: string) {
    const thinkingId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: raw },
      { id: thinkingId, role: "assistant", kind: "thinking", mode: "score" },
    ]);
    setBusy(true);
    try {
      const payload = await requestScore(domain);
      setMessages((prev) => prev.map((m) => (
        m.id === thinkingId
          ? { id: thinkingId, role: "assistant", kind: "score", result: payload }
          : m
      )));
      try {
        const id = await seedChatSession({
          sessionId: sessionId ?? undefined,
          title: payload.domain,
          user: `Score ${payload.domain}`,
          assistant: payload.ai_summary || `${payload.company} scored ${payload.intent_score}/100 (${payload.score_band}).`,
        });
        setSessionId(id);
      } catch {
        // Follow-ups can still create a session on first chat turn.
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => (
        m.id === thinkingId
          ? { id: thinkingId, role: "error", content: (e as Error).message }
          : m
      )));
    } finally {
      setBusy(false);
    }
  }

  async function runFollowUp(text: string) {
    const thinkingId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: text },
      { id: thinkingId, role: "assistant", kind: "thinking", mode: "chat" },
    ]);
    setBusy(true);
    try {
      const nextSession = await streamChat(
        { message: text, session_id: sessionId ?? undefined },
        (event) => {
          setMessages((prev) => {
            const current = prev.find((m) => m.id === thinkingId);
            if (!current) return prev;
            if (event.type === "text") {
              const next: ThreadMessage = current.role === "assistant" && current.kind === "text"
                ? { ...current, content: current.content + event.content }
                : { id: thinkingId, role: "assistant", kind: "text", content: event.content, tools: messageTools(current) };
              return prev.map((m) => (m.id === thinkingId ? next : m));
            }
            if (event.type === "tool_call") {
              const tools: ToolChip[] = [...messageTools(current), { name: event.name, status: "running" }];
              const next: ThreadMessage = current.role === "assistant" && current.kind === "text"
                ? { ...current, tools }
                : { id: thinkingId, role: "assistant", kind: "text", content: "", tools };
              return prev.map((m) => (m.id === thinkingId ? next : m));
            }
            if (event.type === "tool_result") {
              const tools: ToolChip[] = messageTools(current).map((t) => (
                t.name === event.name && t.status === "running" ? { ...t, status: "done", result: event.result } : t
              ));
              const card = scoreFromToolResult(event.name, event.result);
              const base: ThreadMessage = current.role === "assistant" && current.kind === "text"
                ? { ...current, tools }
                : { id: thinkingId, role: "assistant", kind: "text", content: "", tools };
              if (!card) return prev.map((m) => (m.id === thinkingId ? base : m));
              const extras = prev.filter((m) => m.id === `${thinkingId}-score-${event.name}`);
              if (extras.length > 0) return prev.map((m) => (m.id === thinkingId ? base : m));
              return [
                ...prev.map((m) => (m.id === thinkingId ? base : m)),
                { id: `${thinkingId}-score-${event.name}`, role: "assistant", kind: "score", result: card },
              ];
            }
            return prev;
          });
        },
      );
      if (nextSession) setSessionId(nextSession);
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
      setMessages((prev) => prev.map((m) => (
        m.id === thinkingId
          ? { id: thinkingId, role: "error", content: (e as Error).message }
          : m
      )));
    } finally {
      setBusy(false);
    }
  }

  async function submitMessage(rawInput?: string) {
    const raw = (rawInput ?? input).trim();
    if (!raw || busy) return;
    setInput("");
    const domain = extractDomain(raw);
    if (domain) {
      await runScore(raw, domain);
      return;
    }
    await runFollowUp(raw);
  }

  async function handleAddToWatchlist(result: ScoreCardData) {
    setWatchlistByDomain((prev) => ({ ...prev, [result.domain]: "adding" }));
    try {
      const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: result.domain, company_name: result.company }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWatchlistByDomain((prev) => ({ ...prev, [result.domain]: "added" }));
    } catch {
      setWatchlistByDomain((prev) => {
        const next = { ...prev };
        delete next[result.domain];
        return next;
      });
    }
  }

  function handleCopyEmail(result: ScoreCardData) {
    const text = [result.email_subject, result.talk_track].filter(Boolean).join("\n\n");
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedDomain(result.domain);
    setTimeout(() => setCopiedDomain((d) => (d === result.domain ? null : d)), 2000);
  }

  function handleNewChat() {
    if (busy) return;
    setMessages([]);
    setSessionId(null);
    setInput("");
    autoScoredRef.current = null;
  }

  const active = messages.length > 0;

  return (
    <div className="score-chat">
      {!active ? (
        <ScorePromptStage
          domain={input}
          setDomain={setInput}
          onScore={() => void submitMessage()}
          creditsRemaining={creditsRemaining}
          recentScores={recentScores}
          busy={busy}
        />
      ) : (
        <>
          <div className="score-chat-thread" ref={threadRef}>
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
                      <p className="chat-error" role="alert">{message.content}</p>
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
                          Thinking…
                        </div>
                      )}
                    </div>
                  );
                }
                if (message.kind === "score") {
                  return (
                    <div key={message.id} className="chat-row assistant">
                      {"charged" in message.result || "cached" in message.result ? (
                        <LiveProgressBar
                          loading={false}
                          stepIndex={STEPS.length - 1}
                          billingLabel={billingLabel(message.result as ScoreCardData & { charged?: boolean; cached?: boolean })}
                        />
                      ) : null}
                      <ScoreResultCard
                        result={message.result}
                        onWatchlist={() => void handleAddToWatchlist(message.result)}
                        watchlistAdded={watchlistByDomain[message.result.domain] === "added"}
                        watchlistAdding={watchlistByDomain[message.result.domain] === "adding"}
                        onCopyEmail={() => handleCopyEmail(message.result)}
                        emailCopied={copiedDomain === message.result.domain}
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
          <div className="score-chat-composer">
            <div className="prompt-holder prompt-holder--compact">
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
                onKeyDown={(e) => e.key === "Enter" && !busy && void submitMessage()}
                disabled={busy}
                aria-label="Chat message"
              />
              <button type="button" className="prompt-go" onClick={() => void submitMessage()} disabled={busy || !input.trim()}>
                Send
              </button>
            </div>
            <div className="prompt-meta">
              <div className="left">
                <span>Follow-ups <strong>{CHAT_CREDIT_COST}</strong> credits · new domain <strong>1</strong> credit</span>
              </div>
              <div className="right">
                <button type="button" className="chat-new" onClick={handleNewChat} disabled={busy}>
                  New chat
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
