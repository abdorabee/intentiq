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

  const bandColor = (band: string) =>
    band === "HOT" ? "bg-green-500" : band === "WARM" ? "bg-yellow-500" : "bg-gray-400";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="acme.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && score()}
        />
        <Button onClick={score} disabled={loading}>
          {loading ? "…" : "Score"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="flex items-center gap-3 rounded-md border p-3">
          <span className="text-2xl font-black">{result.intent_score}</span>
          <Badge className={`${bandColor(result.score_band)} text-white`}>{result.score_band}</Badge>
          <div>
            <p className="font-medium text-sm">{result.company}</p>
            <p className="text-xs text-muted-foreground">{result.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
