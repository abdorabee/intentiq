"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Zap, Linkedin, Phone, Briefcase, UserCheck, Building2,
  Newspaper, Globe, TrendingUp, MessageSquare, Lightbulb,
} from "lucide-react";
import {
  BuyingJourney,
  UrgencyMeter,
  KeyTriggersVisual,
} from "@/components/score/reasoning-visuals";
import type { PersonIntentScore, DbPersonScore } from "@/lib/types";

// ─── Signal Config ──────────────────────────────────────────────────────────

const PERSON_SIGNAL_LABELS: Record<string, string> = {
  career_change: "Career Trajectory",
  seniority_fit: "Seniority Fit",
  company_intent: "Company Intent",
  news_mentions: "News Mentions",
  social_presence: "Social Presence",
};

const PERSON_SIGNAL_COLORS: Record<string, string> = {
  career_change: "from-violet-500 to-purple-400",
  seniority_fit: "from-emerald-500 to-green-400",
  company_intent: "from-blue-500 to-cyan-400",
  news_mentions: "from-amber-500 to-orange-400",
  social_presence: "from-pink-500 to-rose-400",
};

const PERSON_SIGNAL_ICONS: Record<string, typeof Briefcase> = {
  career_change: TrendingUp,
  seniority_fit: UserCheck,
  company_intent: Building2,
  news_mentions: Newspaper,
  social_presence: Globe,
};

const THINKING_STEPS = [
  "Enriching person profile",
  "Analyzing career trajectory",
  "Evaluating seniority fit",
  "Checking company intent signals",
  "Scanning news mentions",
  "Computing person intent with AI",
];

// ─── Thinking Loader ────────────────────────────────────────────────────────

function ThinkingLoader({ label }: { label: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s < THINKING_STEPS.length - 1 ? s + 1 : s));
    }, 430);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="border-slate-200 dark:border-white/[0.08]">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-violet-500/40 animate-ping opacity-30" />
            <div className="relative h-10 w-10 rounded-full border border-violet-500/30 bg-violet-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Scoring {label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">Thinking</span>
              <span className="flex gap-0.5 items-end">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="inline-block h-1 w-1 rounded-full bg-violet-400"
                    style={{ animation: "thinking-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {THINKING_STEPS.map((text, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= step ? "opacity-100" : "opacity-20"}`}>
              <div className={`h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${
                i < step ? "border-emerald-500/40 bg-emerald-500/15"
                  : i === step ? "border-violet-500/50 bg-violet-500/15 animate-pulse"
                  : "border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03]"
              }`}>
                {i < step ? (
                  <svg className="h-2.5 w-2.5 text-emerald-400" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === step ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                ) : null}
              </div>
              <span className={`text-xs transition-colors duration-300 ${
                i < step ? "text-slate-500" : i === step ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-700"
              }`}>{text}</span>
              {i === step && <span className="ml-auto text-[10px] text-violet-500 font-medium animate-pulse">scanning</span>}
              {i < step && <div className="ml-auto h-px w-10 rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/10" />}
            </div>
          ))}
        </div>
        <div className="h-px bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / THINKING_STEPS.length) * 100}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Input Parser ───────────────────────────────────────────────────────────

function parsePersonInput(input: string): { email?: string; linkedin?: string; name?: string; company?: string; title?: string } {
  const trimmed = input.trim();
  if (trimmed.includes("@") && !trimmed.includes("linkedin.com")) {
    return { email: trimmed };
  }
  if (trimmed.includes("linkedin.com/in/")) {
    return { linkedin: trimmed.startsWith("http") ? trimmed : `https://${trimmed}` };
  }
  // "Name, Title at Company" or "Name at Company"
  const atIdx = trimmed.toLowerCase().lastIndexOf(" at ");
  if (atIdx > 0) {
    const beforeAt = trimmed.slice(0, atIdx).trim();
    const company = trimmed.slice(atIdx + 4).trim();
    // Check for comma separator: "Name, Title"
    const commaIdx = beforeAt.indexOf(",");
    if (commaIdx > 0) {
      return {
        name: beforeAt.slice(0, commaIdx).trim(),
        title: beforeAt.slice(commaIdx + 1).trim(),
        company,
      };
    }
    return { name: beforeAt, company };
  }
  // Fallback — treat as name
  return { name: trimmed };
}

// ─── Band Config ────────────────────────────────────────────────────────────

function bandConfig(band: string) {
  if (band === "HOT") return { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", ring: "from-emerald-400 to-green-500", glow: "", score: "text-emerald-600 dark:text-emerald-400" };
  if (band === "WARM") return { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30", ring: "from-amber-400 to-orange-500", glow: "", score: "text-amber-600 dark:text-amber-400" };
  return { badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30", ring: "from-slate-600 to-slate-700", glow: "", score: "text-slate-600 dark:text-slate-300" };
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PersonIntentScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [recentScores, setRecentScores] = useState<DbPersonScore[]>([]);

  // Load recent scores
  useEffect(() => {
    fetch("/api/dashboard/person-scores?limit=10")
      .then((r) => r.json())
      .then((data) => setRecentScores(data.scores ?? []))
      .catch(() => {});
  }, [result]);

  async function handleScore() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed = parsePersonInput(input);
      const params = new URLSearchParams();
      if (parsed.email) params.set("email", parsed.email);
      if (parsed.linkedin) params.set("linkedin", parsed.linkedin);
      if (parsed.name) params.set("name", parsed.name);
      if (parsed.company) params.set("company", parsed.company);
      if (parsed.title) params.set("title", parsed.title);

      const res = await fetch(`/api/v1/score/person?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Person scoring failed");
      }
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
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
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <span className="text-violet-600 dark:text-violet-400 text-xs tracking-[0.25em] uppercase">[PEOPLE]</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">People Score <span className="inline-block align-middle text-[10px] font-bold uppercase tracking-wide text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 px-1.5 py-0.5 ml-2 -translate-y-0.5">Beta</span></h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">
          Score an individual to understand their purchase intent and how to approach them.
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Sarah Chen, VP of Sales at Acme"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScore()}
          className="bg-slate-50 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-500/50"
        />
        <Button
          onClick={handleScore}
          disabled={loading}
          className="bg-violet-500 hover:bg-violet-400 text-white border-0 cursor-pointer min-w-[90px]"
        >
          {loading ? "Scoring..." : "Score"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <ThinkingLoader label={input.trim()} />}

      {/* Results */}
      {result && (() => {
        const cfg = bandConfig(result.score_band);
        return (
          <div className="space-y-4 animate-slide-up">
            {/* Score Card + Person Info */}
            <Card className={`border-slate-200 dark:border-white/[0.08] ${cfg.glow}`}>
              <CardContent className="flex items-center gap-6 pt-6 flex-wrap">
                <div className={`p-[3px] rounded-full flex-shrink-0 bg-gradient-to-br ${cfg.ring}`}>
                  <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white dark:bg-[#020617]">
                    <span className={`text-4xl font-black ${cfg.score}`}>{result.intent_score}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result.person_name}</h2>
                  <p className="text-slate-500 text-sm">{result.person_title} {result.person_company ? `@ ${result.person_company}` : ""}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={cfg.badge}>{result.score_band}</Badge>
                    {result.person_seniority && (
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 text-[10px]">
                        {result.person_seniority}
                      </Badge>
                    )}
                  </div>
                  {/* Contact info */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    {result.person_email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{result.person_email}</span>
                    )}
                    {result.person_linkedin && (
                      <a href={result.person_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-400">
                        <Linkedin className="h-3 w-3" />LinkedIn
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Decays by {new Date(result.score_decay_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Person Signal Breakdown */}
            <Card className="border-slate-200 dark:border-white/[0.08]">
              <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">Person Signal Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(PERSON_SIGNAL_LABELS) as string[]).map((key) => {
                  const sig = result.signals[key as keyof typeof result.signals];
                  if (!sig || typeof sig === "string") return null;
                  const pct = (sig.score / sig.max) * 100;
                  const Icon = PERSON_SIGNAL_ICONS[key] ?? Globe;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          {PERSON_SIGNAL_LABELS[key]}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">{sig.score}/{sig.max}</span>
                      </div>
                      <div className="relative h-2.5 bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${PERSON_SIGNAL_COLORS[key]} transition-all duration-700`}
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
            <Card className="border-slate-200 dark:border-white/[0.08]">
              <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">AI Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {result.buying_stage && <BuyingJourney stage={result.buying_stage} />}
                  {result.urgency && <UrgencyMeter urgency={result.urgency} />}
                </div>

                {/* AI Summary */}
                <div className="border-l-2 border-violet-500/40 pl-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.ai_summary}</p>
                </div>

                {/* Approach Angle */}
                {result.approach_angle && (
                  <div className="bg-violet-500/10 border border-violet-500/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" />Approach Angle
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{result.approach_angle}</p>
                  </div>
                )}

                {/* Connection Hooks */}
                {result.connection_hooks && result.connection_hooks.length > 0 && (
                  <div className="border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />Connection Hooks
                    </p>
                    <ul className="space-y-1.5">
                      {result.connection_hooks.map((hook, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">-</span>
                          {hook}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Why Now */}
                {result.why_now && (
                  <div className="border-l-2 border-amber-500/60 bg-amber-500/10 px-4 py-3 border border-amber-500/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500 mb-1">Why Now</p>
                    <p className="text-sm text-amber-800/80 dark:text-amber-200/80">{result.why_now}</p>
                  </div>
                )}

                <KeyTriggersVisual triggers={result.key_triggers} />

                {/* Recommended Action */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400 mb-1.5">Recommended Action</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.recommended_action}</p>
                </div>

                {/* Email Subject */}
                {result.email_subject && (
                  <div className="border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Email Subject</p>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{result.email_subject}</p>
                  </div>
                )}

                {/* Talk Track */}
                {result.talk_track && (
                  <div className="border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Talk Track</p>
                    <p className="text-sm italic text-slate-500 dark:text-slate-400">{result.talk_track}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleCopyEmail}
                    className="border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {emailCopied ? "Copied!" : "Copy Email"}
                  </Button>
                  <Button variant="outline" size="sm"
                    className="border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>
                    Copy JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Recent Person Scores */}
      {recentScores.length > 0 && (
        <Card className="border-slate-200 dark:border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100 text-sm">Recent Person Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                    <th className="text-center py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="text-center py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScores.map((s) => {
                    const cfg = bandConfig(s.score_band);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                        onClick={() => {
                          setInput(s.person_email ?? s.person_name);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>
                        <td className="py-2.5 pr-4 text-slate-800 dark:text-slate-200 font-medium">{s.person_name}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{s.person_title ?? "—"}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{s.person_company ?? "—"}</td>
                        <td className="py-2.5 pr-4 text-center">
                          <span className={`font-bold ${cfg.score}`}>{s.score}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <Badge className={`${cfg.badge} text-[10px]`}>{s.score_band}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
