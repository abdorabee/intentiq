"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntentScore } from "@/lib/types";

const QUICK_STEPS = ["Funding", "Hiring", "News", "Tech", "Web", "AI"];

function QuickThinking({ domain }: { domain: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % QUICK_STEPS.length), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4">
      <div className="relative h-8 w-8 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping opacity-25" />
        <div className="relative h-8 w-8 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground/80">Analyzing {domain}</p>
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
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {QUICK_STEPS.map((label, i) => (
            <span
              key={label}
              className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all duration-300 ${
                i < active
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : i === active
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "bg-foreground/[0.04] text-slate-600 border border-foreground/[0.06]"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuickScore() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function score() {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(domain.trim())}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const bandConfig = (band: string) => {
    if (band === "HOT")  return { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" };
    if (band === "WARM") return { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", dot: "bg-amber-400" };
    return { badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30", dot: "bg-slate-400" };
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="acme.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && score()}
          className="bg-foreground/[0.05] border-foreground/[0.08] text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:ring-cyan-500/20"
        />
        <Button
          onClick={score}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer"
        >
          {loading ? "Scoring…" : "Score"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <QuickThinking domain={domain.trim()} />}
      {result && (() => {
        const cfg = bandConfig(result.score_band);
        return (
          <div className="flex items-center gap-4 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-full border border-foreground/[0.1] bg-foreground/[0.05]">
              <span className="text-2xl font-black text-foreground">{result.intent_score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
              <Badge className={`${cfg.badge} rounded-full`}>{result.score_band}</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{result.company}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{result.ai_summary}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
