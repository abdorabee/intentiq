"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { IntentScore } from "@/lib/types";

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
  { domain: "notion.so",      name: "Notion",      signal: "traffic" },
  { domain: "databricks.com", name: "Databricks",  signal: "tech" },
];

const AV_COLORS = [
  "linear-gradient(135deg,#dfff00,#dfff00)",
  "linear-gradient(135deg,#4ade80,#22c55e)",
  "linear-gradient(135deg,#f5b544,#8a8f98)",
  "linear-gradient(135deg,#e8ff40,#dfff00)",
  "linear-gradient(135deg,#f87171,#f5b544)",
  "linear-gradient(135deg,#dfff00,#4ade80)",
  "linear-gradient(135deg,#dfff00,#dfff00)",
  "linear-gradient(135deg,#8a8f98,#f87171)",
  "linear-gradient(135deg,#a78bfa,#e8ff40)",
  "linear-gradient(135deg,#f5b544,#4ade80)",
];

function avColor(name: string): string {
  return AV_COLORS[(name.charCodeAt(0) ?? 0) % AV_COLORS.length];
}

function bandClass(band: string | null): string {
  if (band === "HOT") return "band-hot";
  if (band === "WARM") return "band-warm";
  return "band-cold";
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score, band }: { score: number; band: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const gradColors =
    band === "HOT"
      ? ["#4ade80", "#dfff00", "#e8ff40"]
      : band === "WARM"
      ? ["#f5b544", "#8a8f98", "#e8ff40"]
      : ["var(--text-tertiary)", "var(--text-tertiary)", "var(--text-tertiary)"];

  return (
    <div className="score-ring">
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={gradColors[0]} />
            <stop offset="55%" stopColor={gradColors[1]} />
            <stop offset="100%" stopColor={gradColors[2]} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="50" cy="50" r={r}
          stroke="url(#scoreGrad)" strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      <div className="score-ring-center">
        <span className={`score-ring-band ${bandClass(band)}`}>
          <span className="dot" />{band}
        </span>
        <div className="score-ring-num">{score}</div>
        <div className="score-ring-of">/ 100</div>
      </div>
    </div>
  );
}

// ─── LiveProgressBar ──────────────────────────────────────────────────────────

const STEPS = ["Domain resolved", "Funding signal", "Hiring + news", "Tech + web", "Competitive context", "AI thesis"];

function LiveProgressBar({ loading, stepIndex }: { loading: boolean; stepIndex: number }) {
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
      {!loading && <span className="timing">{elapsed}s · 1 credit</span>}
    </div>
  );
}

// ─── MiniPrompt ───────────────────────────────────────────────────────────────

interface MiniPromptProps {
  domain: string;
  onChange: (v: string) => void;
  onScore: () => void;
}

function MiniPrompt({ domain, onChange, onScore }: MiniPromptProps) {
  return (
    <div className="prompt-holder prompt-holder--compact" style={{ marginBottom: 18 }}>
      <div className="prompt-prefix">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
          <circle cx="7" cy="7" r="5" /><path d="M2 7h10M7 2c2 2 2 8 0 10M7 2c-2 2-2 8 0 10" />
        </svg>
      </div>
      <input
        className="prompt-input"
        type="text"
        value={domain}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onScore()}
        style={{ fontSize: 14 }}
      />
      <div className="prompt-go" onClick={onScore} style={{ cursor: "pointer" }}>
        Re-score
      </div>
    </div>
  );
}

// ─── ResultHead ───────────────────────────────────────────────────────────────

interface ResultHeadProps {
  result: IntentScore;
  onWatchlist: () => void;
  watchlistAdded: boolean;
  watchlistAdding: boolean;
}

function ResultHead({ result, onWatchlist, watchlistAdded, watchlistAdding }: ResultHeadProps) {
  return (
    <div className="result-head">
      <div className="result-avatar" style={{ background: avColor(result.company) }}>
        {result.company[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="result-title-row">
          <span className="result-id">IQ-{result.domain.slice(-4).toUpperCase()}</span>
          <span className={`band ${bandClass(result.score_band)}`}>
            <span className="dot" />{result.score_band}
          </span>
          <span className="result-title">{result.company}</span>
        </div>
        <div className="result-meta">
          <span style={{ color: "var(--text-secondary)" }}>{result.domain}</span>
          <span className="dot" />
          <span>{result.buying_stage}</span>
          <span className="dot" />
          <span>Urgency: {result.urgency}</span>
        </div>
      </div>
      <div className="result-actions">
        <button
          className="tb-btn outlined"
          onClick={onWatchlist}
          disabled={watchlistAdding || watchlistAdded}
        >
          {watchlistAdded ? "Watching ✓" : watchlistAdding ? "Adding…" : "Save to list"}
        </button>
        <a
          className="tb-btn outlined"
          href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(result.company)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open account →
        </a>
      </div>
    </div>
  );
}

// ─── OverviewBlock ────────────────────────────────────────────────────────────

function OverviewBlock({ result }: { result: IntentScore }) {
  return (
    <div className="overview-block">
      <ScoreRing score={result.intent_score} band={result.score_band} />
      <div className="thesis-block">
        <div className="thesis-head">
          <span className="ic" />
          AI thesis · Claude
        </div>
        <div className="thesis-text">{result.ai_summary}</div>
        <div className="thesis-meta">
          <span>Generated just now</span>
          <span className="dot" />
          {result.confidence != null && (
            <>
              <span>Confidence {result.confidence.toFixed(2)}</span>
              <span className="dot" />
            </>
          )}
          <span>Urgency: {result.urgency}</span>
        </div>
      </div>
    </div>
  );
}

// ─── SignalGrid ───────────────────────────────────────────────────────────────

const SIGNAL_CONFIG = [
  { key: "funding"    as const, label: "Funding", color: "#dfff00", grad: "linear-gradient(90deg,#dfff00,#38a3b3)" },
  { key: "hiring"     as const, label: "Hiring",  color: "#4ade80", grad: "linear-gradient(90deg,#4ade80,#22c55e)" },
  { key: "news"       as const, label: "News",    color: "#f5b544", grad: "linear-gradient(90deg,#f5b544,#d49530)" },
  { key: "technology" as const, label: "Tech",    color: "#e8ff40", grad: "linear-gradient(90deg,#e8ff40,#dfff00)" },
  { key: "web"        as const, label: "Web",     color: "#8a8f98", grad: "linear-gradient(90deg,#8a8f98,#c0367f)" },
];

function SignalGrid({ result }: { result: IntentScore }) {
  return (
    <>
      <div className="section-label">
        <span className="ic" />
        <strong>Signal axes</strong>
        <span style={{ color: "var(--text-tertiary)" }}>· 5 contributing inputs</span>
        <span className="line" />
      </div>
      <div className="signal-grid">
        {SIGNAL_CONFIG.map(({ key, label, color, grad }) => {
          const sig = result.signals[key];
          const pct = sig ? Math.round((sig.score / sig.max) * 100) : 0;
          return (
            <div key={key} className="signal-card">
              <div className="name">
                <span className="swatch" style={{ background: color }} />
                {label}
              </div>
              <div className="num">{sig?.score ?? "—"}</div>
              <div className="delta" style={{ color: "var(--text-tertiary)" }}>/{sig?.max ?? 100}</div>
              <div className="bar">
                <div className="fill" style={{ width: `${pct}%`, background: grad }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── CompetitiveAnalysis ──────────────────────────────────────────────────────

interface CompetitiveAnalysisProps {
  result: IntentScore;
  onCopyEmail: () => void;
  emailCopied: boolean;
}

const RADAR_AXES = ["funding", "hiring", "news", "technology", "web"] as const;
const RADAR_ANGLES = [-90, -18, 54, 126, 198].map((d) => (d * Math.PI) / 180);
const RADAR_LABELS = ["Funding", "Hiring", "News", "Tech", "Web"];
const R = 100;

function toXY(angle: number, ratio: number): [number, number] {
  return [Math.cos(angle) * R * ratio, Math.sin(angle) * R * ratio];
}

function CompetitiveAnalysis({ result, onCopyEmail, emailCopied }: CompetitiveAnalysisProps) {
  const companyPoints = RADAR_AXES.map((key, i) => {
    const sig = result.signals[key];
    const ratio = sig ? sig.score / sig.max : 0;
    return toXY(RADAR_ANGLES[i], ratio);
  });
  const pointsStr = companyPoints.map(([x, y]) => `${x},${y}`).join(" ");

  const ringPoints = (ratio: number) =>
    RADAR_ANGLES.map((a) => toXY(a, ratio))
      .map(([x, y]) => `${x},${y}`)
      .join(" ");

  const strengths = RADAR_AXES.filter((k) => {
    const s = result.signals[k];
    return s && s.score / s.max > 0.7;
  });
  const gaps = RADAR_AXES.filter((k) => {
    const s = result.signals[k];
    return s && s.score / s.max < 0.4;
  });

  return (
    <>
      <div className="section-label" style={{ marginTop: 32 }}>
        <span className="ic" style={{ background: "var(--accent-2)", boxShadow: "0 0 6px var(--accent-2)" }} />
        <strong>Signal radar</strong>
        <span style={{ color: "var(--text-tertiary)" }}>· {result.company} vs signal benchmarks</span>
        <span className="line" />
      </div>

      <div className="ca-radar-block">
        <div className="ca-radar-wrap">
          <svg className="ca-radar-svg" viewBox="-130 -130 260 260">
            <g fill="none" stroke="var(--border)" strokeWidth="1">
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <polygon key={ratio} points={ringPoints(ratio)} />
              ))}
            </g>
            <g stroke="var(--border-subtle)" strokeWidth="1">
              {RADAR_ANGLES.map((a, i) => (
                <line key={i} x1="0" y1="0" x2={Math.cos(a) * R} y2={Math.sin(a) * R} />
              ))}
            </g>
            <polygon points={pointsStr} fill="rgba(74,222,128,0.18)" stroke="#4ade80" strokeWidth="2" />
            {companyPoints.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#4ade80" />
            ))}
            <g fontFamily="JetBrains Mono" fontSize="9" fill="#8a8f98">
              {RADAR_ANGLES.map((a, i) => {
                const lx = Math.cos(a) * (R + 14);
                const ly = Math.sin(a) * (R + 14);
                const anchor = lx < -5 ? "end" : lx > 5 ? "start" : "middle";
                return (
                  <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle">
                    {RADAR_LABELS[i]}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="ca-radar-legend">
          <div className="ca-legend-row">
            <span className="swatch" style={{ background: "#4ade80" }} />
            <span className="name">
              <span className="co-av" style={{ background: avColor(result.company) }}>{result.company[0]}</span>
              <span className="label">{result.company}</span>
              <span className="you-tag">You</span>
            </span>
            <span className="avg">{result.intent_score}</span>
          </div>

          <div className="sg-grid">
            <div className="sg-col win">
              <div className="head">Where {result.company} leads</div>
              <div className="list">
                {strengths.length > 0 ? (
                  strengths.map((k) => {
                    const s = result.signals[k];
                    return (
                      <div key={k} className="it">
                        <span>
                          <strong style={{ textTransform: "capitalize" }}>{k}</strong> · {s?.score}/{s?.max} · {s?.detail?.slice(0, 80)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="it"><span>No dominant signals detected</span></div>
                )}
              </div>
            </div>
            <div className="sg-col gap">
              <div className="head">Signals to watch</div>
              <div className="list">
                {gaps.length > 0 ? (
                  gaps.map((k) => {
                    const s = result.signals[k];
                    return (
                      <div key={k} className="it">
                        <span>
                          <strong style={{ textTransform: "capitalize" }}>{k}</strong> · {s?.score}/{s?.max} · {s?.detail?.slice(0, 80)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="it"><span>No weak signals — all axes are healthy</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ca-block" style={{ marginBottom: 40 }}>
        <div className="ca-verdict">
          <div className="ai-dot" />
          <div className="text">
            <span className="label">AI verdict · Claude</span>
            {result.recommended_action && <strong>{result.recommended_action} </strong>}
            {result.why_now}
          </div>
          <div className="verdict-actions">
            <button
              className="tb-btn outlined"
              onClick={onCopyEmail}
              disabled={!result.email_subject && !result.talk_track}
            >
              {emailCopied ? "Copied!" : "Copy email + talk track"}
            </button>
            <a
              className="tb-btn"
              style={{
                background: "var(--accent)",
                color: "#fff",
                padding: "0 12px",
                height: 30,
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                textDecoration: "none",
              }}
              href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(result.company)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Draft outreach →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ScorePromptStage ─────────────────────────────────────────────────────────

interface ScorePromptStageProps {
  domain: string;
  setDomain: (v: string) => void;
  onScore: () => void;
  creditsRemaining: number;
  recentScores: RecentScore[];
}

function ScorePromptStage({ domain, setDomain, onScore, creditsRemaining, recentScores }: ScorePromptStageProps) {
  return (
    <div className="prompt-stage">
      <div className="prompt-bg">
        <div className="grid" />
      </div>
      <div className="prompt-inner">
        <div className="prompt-eyebrow">
          <span className="badge">Score</span>
          Drop in a domain — we&apos;ll do the rest in &lt; 3 seconds
        </div>

        <h1 className="prompt-h1">
          What account do you want to{" "}
          <span className="grad">score</span>?
        </h1>
        <p className="prompt-sub">
          Paste any company domain. VesperWise scans funding, hiring, news, tech stack,
          and web presence — then returns a 0–100 buying-intent score with AI reasoning.
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
            onKeyDown={(e) => e.key === "Enter" && onScore()}
            autoFocus
          />
          <div className="prompt-go" onClick={onScore} style={{ cursor: "pointer" }}>
            Score
            <span className="kbd-inline">↵</span>
          </div>
        </div>

        <div className="prompt-meta">
          <div className="left">
            <span><strong>1</strong> credit · refunded if no signals found</span>
            <span>Cached for <strong>6h</strong></span>
          </div>
          <div className="right">
            <span><strong>&lt; 3s</strong> typical</span>
            <span><strong>{creditsRemaining}</strong> credits left</span>
          </div>
        </div>

        <div className="prompt-section-label">
          <span>Try a hot pick</span>
          <span className="line" />
        </div>
        <div className="suggestion-row">
          {HOT_PICKS.map((pick) => (
            <div key={pick.domain} className="sugg" onClick={() => setDomain(pick.domain)} style={{ cursor: "pointer" }}>
              <div className="av" style={{ background: avColor(pick.name) }}>{pick.name[0]}</div>
              {pick.domain}
              <span className="mono-sm">▲ {pick.signal}</span>
            </div>
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
                <div key={r.domain} className="recent" onClick={() => setDomain(r.domain)} style={{ cursor: "pointer" }}>
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
                </div>
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
            5 signal axes
          </div>
          <div className="feat">
            <span className="ic" style={{ background: "rgba(223,255,0,0.12)", color: "#dfff00" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <circle cx="6" cy="6" r="4" /><path d="M6 4v3l2 1" />
              </svg>
            </span>
            AI thesis from Claude
          </div>
          <div className="feat">
            <span className="ic" style={{ background: "rgba(74,222,128,0.12)", color: "var(--hot)" }}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                <path d="M2 9V5m3 4V3m3 6V6" />
              </svg>
            </span>
            Signal breakdown · 5 inputs
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

// ─── ScoreView (main export) ──────────────────────────────────────────────────

export function ScoreView({ creditsRemaining, recentScores }: ScoreViewProps) {
  const searchParams = useSearchParams();
  const autoScoredRef = useRef<string | null>(null);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [watchlistAdding, setWatchlistAdding] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    const d = searchParams.get("domain")?.trim();
    if (!d) return;
    setDomain(d);
    if (autoScoredRef.current === d) return;
    autoScoredRef.current = d;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(d)}`);
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Scoring failed");
        }
        if (!cancelled) setResult((await res.json()) as IntentScore);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    setWatchlistAdded(false);
    setEmailCopied(false);
  }, [result]);

  useEffect(() => {
    if (!loading) { setStepIndex(0); return; }
    setStepIndex(0);
    const t = setInterval(() => {
      setStepIndex((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 430);
    return () => clearInterval(t);
  }, [loading]);

  async function handleScore() {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(domain.trim())}`);
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Scoring failed");
      }
      setResult(await res.json() as IntentScore);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWatchlist() {
    if (!result) return;
    setWatchlistAdding(true);
    try {
      const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: result.domain, company_name: result.company }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWatchlistAdded(true);
    } catch {
      // swallow watchlist errors silently
    } finally {
      setWatchlistAdding(false);
    }
  }

  function handleCopyEmail() {
    if (!result) return;
    const text = [result.email_subject, result.talk_track].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {!result && !loading ? (
        <ScorePromptStage
          domain={domain}
          setDomain={setDomain}
          onScore={handleScore}
          creditsRemaining={creditsRemaining}
          recentScores={recentScores}
        />
      ) : (
        <div className="result-page">
          <LiveProgressBar loading={loading} stepIndex={stepIndex} />
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          {!loading && result && (
            <>
              <MiniPrompt domain={domain} onChange={setDomain} onScore={handleScore} />
              <ResultHead
                result={result}
                onWatchlist={handleAddToWatchlist}
                watchlistAdded={watchlistAdded}
                watchlistAdding={watchlistAdding}
              />
              <OverviewBlock result={result} />
              <SignalGrid result={result} />
              <CompetitiveAnalysis result={result} onCopyEmail={handleCopyEmail} emailCopied={emailCopied} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
