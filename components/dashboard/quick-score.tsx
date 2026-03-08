"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntentScore } from "@/lib/types";

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
          className="bg-white/[0.05] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20"
        />
        <Button
          onClick={score}
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-400 text-white border-0 cursor-pointer"
        >
          {loading ? "Scoring…" : "Score"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (() => {
        const cfg = bandConfig(result.score_band);
        return (
          <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-full border border-white/[0.1] bg-white/[0.05]">
              <span className="text-2xl font-black text-slate-100">{result.intent_score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
              <Badge className={`${cfg.badge} rounded-full`}>{result.score_band}</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 text-sm">{result.company}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{result.ai_summary}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
