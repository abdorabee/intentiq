"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Mail, Zap } from "lucide-react";
import type { IntentScore } from "@/lib/types";

const SIGNAL_LABELS = {
  funding:    "Funding & Growth",
  hiring:     "Hiring Signals",
  news:       "News & Trigger Events",
  technology: "Technology Stack",
  web:        "Web & Digital",
};

const SIGNAL_COLORS: Record<string, string> = {
  funding:    "from-cyan-500 to-sky-400",
  hiring:     "from-emerald-500 to-green-400",
  news:       "from-amber-500 to-orange-400",
  technology: "from-blue-500 to-cyan-400",
  web:        "from-pink-500 to-rose-400",
};

const THINKING_STEPS = [
  "Fetching funding & growth data",
  "Scanning hiring velocity",
  "Reading news & trigger events",
  "Analyzing technology stack",
  "Measuring web presence",
  "Computing intent score with AI",
];

function ThinkingLoader({ domain }: { domain: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s < THINKING_STEPS.length - 1 ? s + 1 : s));
    }, 430);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="border-white/[0.08]">
      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping opacity-30" />
            <div className="relative h-10 w-10 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Analyzing {domain}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">Thinking</span>
              <span className="flex gap-0.5 items-end">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1 w-1 rounded-full bg-cyan-400"
                    style={{ animation: "thinking-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Signal steps */}
        <div className="space-y-2.5">
          {THINKING_STEPS.map((label, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-500 ${i <= step ? "opacity-100" : "opacity-20"}`}
            >
              <div className={`h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${
                i < step
                  ? "border-emerald-500/40 bg-emerald-500/15"
                  : i === step
                  ? "border-cyan-500/50 bg-cyan-500/15 animate-pulse"
                  : "border-white/[0.08] bg-white/[0.03]"
              }`}>
                {i < step ? (
                  <svg className="h-2.5 w-2.5 text-emerald-400" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === step ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                ) : null}
              </div>
              <span className={`text-xs transition-colors duration-300 ${
                i < step ? "text-slate-500" : i === step ? "text-slate-200 font-medium" : "text-slate-700"
              }`}>
                {label}
              </span>
              {i === step && (
                <span className="ml-auto text-[10px] text-cyan-500 font-medium animate-pulse">scanning</span>
              )}
              {i < step && (
                <div className="ml-auto h-px w-10 rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/10" />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-px bg-white/[0.04] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / THINKING_STEPS.length) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScoreExplorerPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [watchlistAdding, setWatchlistAdding] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    setWatchlistAdded(false);
    setWatchlistError(null);
    setEmailCopied(false);
  }, [result]);

  async function handleScore() {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(domain.trim())}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Scoring failed");
      }
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWatchlist() {
    if (!result) return;
    setWatchlistAdding(true);
    setWatchlistError(null);
    try {
      const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: result.domain, company_name: result.company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWatchlistAdded(true);
    } catch (e) {
      setWatchlistError((e as Error).message);
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

  const bandConfig = (band: string) => {
    if (band === "HOT")  return { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", ring: "from-emerald-400 to-green-500", glow: "glow-emerald", score: "text-emerald-400", pulse: "animate-score-hot" };
    if (band === "WARM") return { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", ring: "from-amber-400 to-orange-500", glow: "glow-amber", score: "text-amber-400", pulse: "animate-score-warm" };
    return { badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30", ring: "from-slate-600 to-slate-700", glow: "", score: "text-slate-300", pulse: "" };
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[SCORE]</span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Score Explorer</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">Enter a domain to get a full intent score with signal breakdown.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="acme.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScore()}
          className="bg-white/[0.05] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50"
        />
        <Button
          onClick={handleScore}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer min-w-[90px]"
        >
          {loading ? "Scoring…" : "Score"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && <ThinkingLoader domain={domain.trim()} />}

      {result && (() => {
        const cfg = bandConfig(result.score_band);
        return (
          <div className="space-y-4">
            {/* Score dial */}
            <Card className={`border-white/[0.08] ${cfg.glow}`}>
              <CardContent className="flex items-center gap-6 pt-6 flex-wrap">
                <div className={`p-[3px] rounded-full flex-shrink-0 bg-gradient-to-br ${cfg.ring} ${cfg.pulse}`}>
                  <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#020617]">
                    <span className={`text-4xl font-black ${cfg.score}`}>{result.intent_score}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-slate-100">{result.company}</h2>
                  <p className="text-slate-400 text-sm">{result.domain}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${cfg.badge}`}>{result.score_band}</Badge>
                    <Button
                      size="sm"
                      onClick={handleAddToWatchlist}
                      disabled={watchlistAdding || watchlistAdded}
                      className={`gap-1.5 cursor-pointer h-7 text-xs ${
                        watchlistAdded
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-white/[0.06] border border-white/[0.10] text-slate-300 hover:bg-white/[0.12] hover:text-slate-100"
                      }`}
                    >
                      {watchlistAdded
                        ? <><Check className="h-3 w-3" />Watching</>
                        : <><Plus className="h-3 w-3" />{watchlistAdding ? "Adding…" : "Watch"}</>
                      }
                    </Button>
                  </div>
                  {watchlistError && <p className="text-xs text-red-400 mt-1">{watchlistError}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    Decays by {new Date(result.score_decay_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Signal breakdown */}
            <Card className="border-white/[0.08]">
              <CardHeader><CardTitle className="text-slate-100">Signal Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {(Object.keys(SIGNAL_LABELS) as Array<keyof typeof SIGNAL_LABELS>).map((key) => {
                  const sig = result.signals[key];
                  const pct = (sig.score / sig.max) * 100;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-200">{SIGNAL_LABELS[key]}</span>
                        <span className="text-slate-500 font-mono text-xs">{sig.score}/{sig.max}</span>
                      </div>
                      <div className="relative h-2.5 bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${SIGNAL_COLORS[key]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">{sig.detail}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="border-white/[0.08]">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-slate-100">AI Analysis</CardTitle>
                  <div className="flex gap-2">
                    {result.buying_stage && (
                      <span className="text-xs bg-white/[0.07] text-slate-300 px-2.5 py-1 font-medium capitalize border border-white/[0.08]">
                        {result.buying_stage}
                      </span>
                    )}
                    {result.urgency && (
                      <span className={`text-xs px-2.5 py-1 font-medium border ${
                        result.urgency === "act-now"    ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : result.urgency === "this-week"  ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                        : result.urgency === "this-month" ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        :                                   "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }`}>
                        {result.urgency}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">{result.ai_summary}</p>

                {result.why_now && (
                  <div className="border-l-2 border-amber-500/60 bg-amber-500/10 px-4 py-3 border border-amber-500/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">Why Now</p>
                    <p className="text-sm text-amber-200/80">{result.why_now}</p>
                  </div>
                )}

                {result.key_triggers && result.key_triggers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Key Triggers</p>
                    <div className="flex flex-wrap gap-2">
                      {result.key_triggers.map((t, i) => (
                        <span key={i} className="text-xs bg-white/[0.06] text-slate-300 px-2.5 py-1 border border-white/[0.08]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-1.5">Recommended Action</p>
                  <p className="text-sm font-medium text-slate-200">{result.recommended_action}</p>
                </div>

                {result.email_subject && (
                  <div className="border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Email Subject</p>
                    <p className="text-sm font-mono text-slate-300">{result.email_subject}</p>
                  </div>
                )}

                {result.talk_track && (
                  <div className="border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Talk Track</p>
                    <p className="text-sm italic text-slate-400">{result.talk_track}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/[0.12] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] cursor-pointer gap-1.5"
                    onClick={handleCopyEmail}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {emailCopied ? "Copied!" : "Copy Email"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/[0.12] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                  >
                    Copy JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
