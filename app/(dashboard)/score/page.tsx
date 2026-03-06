"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { IntentScore } from "@/lib/types";

const SIGNAL_LABELS = {
  funding: "Funding & Growth",
  hiring: "Hiring Signals",
  news: "News & Trigger Events",
  technology: "Technology Stack",
  web: "Web & Digital",
};

export default function ScoreExplorerPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentScore | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const bandColor = (band: string) =>
    band === "HOT" ? "bg-green-500" : band === "WARM" ? "bg-yellow-500" : "bg-gray-400";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Score Explorer</h1>
        <p className="text-muted-foreground">Enter a domain to get a full intent score with signal breakdown.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="acme.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScore()}
        />
        <Button onClick={handleScore} disabled={loading}>
          {loading ? "Scoring…" : "Score"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* Score dial */}
          <Card>
            <CardContent className="flex items-center gap-6 pt-6">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-muted">
                <span className={`absolute inset-0 rounded-full ${bandColor(result.score_band)} opacity-10`} />
                <span className="text-4xl font-black">{result.intent_score}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{result.company}</h2>
                <p className="text-muted-foreground">{result.domain}</p>
                <Badge className={`${bandColor(result.score_band)} text-white mt-1`}>
                  {result.score_band}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  Decays by {new Date(result.score_decay_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signal breakdown */}
          <Card>
            <CardHeader><CardTitle>Signal Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(SIGNAL_LABELS) as Array<keyof typeof SIGNAL_LABELS>).map((key) => {
                const sig = result.signals[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{SIGNAL_LABELS[key]}</span>
                      <span className="text-muted-foreground">{sig.score}/{sig.max}</span>
                    </div>
                    <Progress value={(sig.score / sig.max) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">{sig.detail}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI summary */}
          <Card>
            <CardHeader><CardTitle>AI Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{result.ai_summary}</p>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Recommended Action</p>
                <p className="text-sm font-medium">{result.recommended_action}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
              >
                Copy JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
