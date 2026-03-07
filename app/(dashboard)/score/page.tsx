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
          <Card className="border-subtle shadow-none">
            <CardContent className="flex items-center gap-6 pt-6">
              <div className={`p-[3px] rounded-full flex-shrink-0 ${
                result.score_band === "HOT"  ? "bg-gradient-to-br from-green-400 to-emerald-600" :
                result.score_band === "WARM" ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                                               "bg-gradient-to-br from-gray-300 to-gray-400"
              }`}>
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white">
                  <span className="text-4xl font-black">{result.intent_score}</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{result.company}</h2>
                <p className="text-muted-foreground">{result.domain}</p>
                <Badge className={`mt-1 rounded-full ${
                  result.score_band === "HOT"  ? "bg-green-100 text-green-700 border-green-200" :
                  result.score_band === "WARM" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                  "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {result.score_band}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  Decays by {new Date(result.score_decay_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signal breakdown */}
          <Card className="border-subtle shadow-none">
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

          {/* AI Analysis */}
          <Card className="border-subtle shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Analysis</CardTitle>
                <div className="flex gap-2">
                  {result.buying_stage && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium capitalize">
                      {result.buying_stage}
                    </span>
                  )}
                  {result.urgency && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      result.urgency === "act-now" ? "bg-red-100 text-red-700" :
                      result.urgency === "this-week" ? "bg-orange-100 text-orange-700" :
                      result.urgency === "this-month" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {result.urgency}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{result.ai_summary}</p>

              {result.why_now && (
                <div className="rounded-md border-l-4 border-orange-400 bg-orange-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-orange-700 mb-1">Why Now</p>
                  <p className="text-sm text-orange-900">{result.why_now}</p>
                </div>
              )}

              {result.key_triggers && result.key_triggers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Key Triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {result.key_triggers.map((t, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Recommended Action</p>
                <p className="text-sm font-medium">{result.recommended_action}</p>
              </div>

              {result.email_subject && (
                <div className="rounded-md border border-subtle px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Email Subject</p>
                  <p className="text-sm font-mono">{result.email_subject}</p>
                </div>
              )}

              {result.talk_track && (
                <div className="rounded-md border border-subtle px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Talk Track</p>
                  <p className="text-sm italic text-muted-foreground">{result.talk_track}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
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
