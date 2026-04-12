"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, Mail, Zap } from "lucide-react";
import type { IntentScore } from "@/lib/types";
import {
  SignalRadarChart,
  SignalDonut,
  BuyingJourney,
  UrgencyMeter,
  KeyTriggersVisual,
} from "@/components/score/reasoning-visuals";

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

export function ThinkingLoader({ domain }: { domain: string }) {
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
              {i === step && <span className="ml-auto text-[11px] text-cyan-500 font-medium animate-pulse">scanning</span>}
              {i < step && <div className="ml-auto h-px w-10 rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/10" />}
            </div>
          ))}
        </div>

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

function icpFitConfig(score: number) {
  if (score >= 80) return { label: "Strong ICP Fit", cls: "bg-emerald-500 text-white border-emerald-600" };
  if (score >= 60) return { label: "Good ICP Fit",   cls: "bg-cyan-500 text-white border-cyan-600" };
  if (score >= 40) return { label: "Partial Fit",    cls: "bg-amber-500 text-white border-amber-600" };
  return { label: "Weak Fit", cls: "bg-slate-500 text-white border-slate-600" };
}

export function ScoreResult({ result }: { result: IntentScore }) {
  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [watchlistAdding, setWatchlistAdding] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const bandConfig = (band: string) => {
    if (band === "HOT")  return { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", ring: "from-emerald-400 to-green-500", glow: "glow-emerald", score: "text-emerald-400", pulse: "animate-score-hot" };
    if (band === "WARM") return { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", ring: "from-amber-400 to-orange-500", glow: "glow-amber", score: "text-amber-400", pulse: "animate-score-warm" };
    return { badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30", ring: "from-slate-600 to-slate-700", glow: "", score: "text-slate-300", pulse: "" };
  };

  async function handleAddToWatchlist() {
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
    const text = [result.email_subject, result.talk_track].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  const cfg = bandConfig(result.score_band);
  const icpFit = result.icp_fit_score != null ? icpFitConfig(result.icp_fit_score) : null;

  return (
    <div className="space-y-4">
      {/* Score dial */}
      <Card className={`border-slate-200 dark:border-white/[0.12] ${cfg.glow}`}>
        <CardContent className="flex items-center gap-6 pt-6 flex-wrap">
          <div className={`p-[5px] rounded-full flex-shrink-0 bg-gradient-to-br ${cfg.ring} ${cfg.pulse}`}>
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white dark:bg-[#020617]">
              <span className={`text-4xl font-black ${cfg.score}`}>{result.intent_score}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result.company}</h2>
            <p className="text-slate-400 text-sm">{result.domain}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={cfg.badge}>{result.score_band}</Badge>
              {icpFit && result.icp_fit_score! > 0 && (
                <span className={`text-[11px] px-2 py-0.5 border font-medium rounded-sm ${icpFit.cls}`}>
                  {icpFit.label} · {result.icp_fit_score}%
                </span>
              )}
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
      <Card className="border-slate-200 dark:border-white/[0.12]">
        <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">Signal Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 mb-2 text-center">Signal Radar</p>
              <SignalRadarChart signals={result.signals} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 mb-2 text-center">Score Composition</p>
              <SignalDonut signals={result.signals} totalScore={result.intent_score} />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
            {(Object.keys(SIGNAL_LABELS) as Array<keyof typeof SIGNAL_LABELS>).map((key) => {
              const sig = result.signals[key];
              const pct = (sig.score / sig.max) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{SIGNAL_LABELS[key]}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">{sig.score}/{sig.max}</span>
                  </div>
                  <div className="relative h-2.5 bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${SIGNAL_COLORS[key]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{sig.detail}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card className="border-slate-200 dark:border-white/[0.12]">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {result.buying_stage && <BuyingJourney stage={result.buying_stage} />}
            {result.urgency && <UrgencyMeter urgency={result.urgency} />}
          </div>

          <div className="border-l-2 border-cyan-500/40 pl-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.ai_summary}</p>
          </div>

          {result.why_now && (
            <div className="border-l-2 border-amber-500/60 bg-amber-500/10 px-4 py-3 border border-amber-500/15">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500 mb-1">Why Now</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80">{result.why_now}</p>
            </div>
          )}

          <KeyTriggersVisual triggers={result.key_triggers} />

          <div className="bg-cyan-500/10 border border-cyan-500/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400 mb-1.5">Recommended Action</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.recommended_action}</p>
          </div>

          {result.email_subject && (
            <div className="border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Email Subject</p>
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{result.email_subject}</p>
            </div>
          )}

          {result.talk_track && (
            <div className="border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Talk Track</p>
              <p className="text-sm italic text-slate-500 dark:text-slate-400">{result.talk_track}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer gap-1.5"
              onClick={handleCopyEmail}
            >
              <Mail className="h-3.5 w-3.5" />
              {emailCopied ? "Copied!" : "Copy Email"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
            >
              Copy JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
