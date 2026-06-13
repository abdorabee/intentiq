"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Loader2, AlertCircle, X } from "lucide-react";
import { toCSV, downloadCSV as triggerDownload, csvFilename, formatSignal } from "@/lib/csv";
import type { SignalSet } from "@/lib/types";

interface BulkResult {
  domain: string;
  company_name: string;
  intent_score: number;
  score_band: string;
  buying_stage: string;
  urgency: string;
  ai_summary: string;
  why_now: string;
  recommended_action: string;
  key_triggers: string[];
  email_subject: string;
  talk_track: string;
  signals: SignalSet;
  last_updated: string;
}

interface BulkResponse {
  total: number;
  scored: number;
  failed: number;
  results: BulkResult[];
  errors?: Array<{ domain: string; error: string }>;
}

const LOADING_PHASES = [
  { emoji: "\u{1F9E0}", text: "Thinking...", sub: "Parsing your CSV and warming up the pipeline" },
  { emoji: "\u{1F50D}", text: "Investigating...", sub: "Pulling funding rounds, hiring trends, and news signals" },
  { emoji: "\u{1F4CA}", text: "Crunching numbers...", sub: "Computing weighted intent scores across 5 signal dimensions" },
  { emoji: "\u{2728}", text: "Reasoning...", sub: "AI is analyzing patterns and writing summaries" },
  { emoji: "\u{1F3AF}", text: "Ranking...", sub: "Sorting companies by purchase intent — hottest leads first" },
  { emoji: "\u{1F4E6}", text: "Shipping...", sub: "Packaging your results. Almost there!" },
  { emoji: "\u{1F525}", text: "Finalizing...", sub: "Wrapping up the last few scores" },
];

function useLoadingPhase(isLoading: boolean) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % LOADING_PHASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isLoading]);

  return LOADING_PHASES[phase];
}

export default function BulkScorerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BulkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingPhase = useLoadingPhase(loading);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) {
      setFile(f);
      setError(null);
    }
  }

  function clearFile() {
    setFile(null);
    setResponse(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/score/bulk-inline", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Scoring failed");
      }

      setResponse(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadCSV() {
    if (!response?.results.length) return;

    const columns = [
      { key: "company_name",       label: "Company" },
      { key: "domain",             label: "Domain" },
      { key: "intent_score",       label: "Intent Score" },
      { key: "score_band",         label: "Score Band" },
      { key: "buying_stage",       label: "Buying Stage" },
      { key: "urgency",            label: "Urgency" },
      { key: "ai_summary",         label: "AI Summary" },
      { key: "why_now",            label: "Why Now" },
      { key: "recommended_action", label: "Recommended Action" },
      { key: "key_triggers",       label: "Key Triggers" },
      { key: "email_subject",      label: "Email Subject" },
      { key: "talk_track",         label: "Talk Track" },
      { key: "funding_signal",     label: "Funding Signal" },
      { key: "hiring_signal",      label: "Hiring Signal" },
      { key: "news_signal",        label: "News Signal" },
      { key: "technology_signal",   label: "Technology Signal" },
      { key: "web_signal",         label: "Web Signal" },
      { key: "scored_at",          label: "Scored At" },
    ];

    const rows = response.results.map((r) => ({
      company_name:       r.company_name,
      domain:             r.domain,
      intent_score:       r.intent_score,
      score_band:         r.score_band,
      buying_stage:       r.buying_stage,
      urgency:            r.urgency,
      ai_summary:         r.ai_summary,
      why_now:            r.why_now,
      recommended_action: r.recommended_action,
      key_triggers:       (r.key_triggers ?? []).join("; "),
      email_subject:      r.email_subject,
      talk_track:         r.talk_track,
      funding_signal:     formatSignal(r.signals?.funding),
      hiring_signal:      formatSignal(r.signals?.hiring),
      news_signal:        formatSignal(r.signals?.news),
      technology_signal:  formatSignal(r.signals?.technology),
      web_signal:         formatSignal(r.signals?.web),
      scored_at:          r.last_updated,
    }));

    const content = toCSV(columns, rows);
    triggerDownload(content, csvFilename("vesperwise-bulk-scores"));
  }

  const bandColor = (band: string) => {
    switch (band) {
      case "HOT": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "WARM": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      default: return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[BULK SCORER]</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Bulk Score</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">
          Upload a CSV of companies and score them all at once. Max 50 companies per batch.
        </p>
      </div>

      {/* Upload card */}
      <Card className="border-slate-200 dark:border-foreground/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-foreground/[0.12] p-5 sm:p-10 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            {file ? (
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="ml-2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">
                  Drag & drop a CSV here, or click to select.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  CSV must have a <code className="bg-slate-100 dark:bg-foreground/[0.06] px-1.5 py-0.5 text-cyan-600 dark:text-cyan-400">domain</code> or <code className="bg-slate-100 dark:bg-foreground/[0.06] px-1.5 py-0.5 text-cyan-600 dark:text-cyan-400">company</code> column.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scoring...
                </>
              ) : (
                "Score Companies"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator with rotating phases */}
      {loading && (
        <Card className="border-cyan-500/20 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-cyan-500 via-sky-400 to-transparent" />
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-pulse">
                  <span className="text-2xl" key={loadingPhase.emoji}>{loadingPhase.emoji}</span>
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-4 w-4 text-cyan-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-lg tracking-tight transition-all duration-300">
                  {loadingPhase.text}
                </p>
                <p className="text-sm text-slate-500 max-w-sm transition-all duration-300">
                  {loadingPhase.sub}
                </p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {LOADING_PHASES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-6 transition-all duration-500 ${
                      i <= LOADING_PHASES.indexOf(loadingPhase)
                        ? "bg-cyan-400"
                        : "bg-slate-200 dark:bg-foreground/[0.08]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {response && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs">
                {response.scored} scored
              </Badge>
              {response.failed > 0 && (
                <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs">
                  {response.failed} failed
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="border-slate-300 dark:border-foreground/[0.12] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-foreground/[0.05] cursor-pointer gap-2"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>

          {/* Results table */}
          <Card className="border-slate-200 dark:border-foreground/[0.08] overflow-hidden">
            <div className="h-px bg-gradient-to-r from-cyan-500 via-sky-400 to-transparent" />
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-foreground/[0.06]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Domain</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
                      <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">AI Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.results.map((r, i) => (
                      <tr
                        key={r.domain + i}
                        className="border-b border-slate-100 dark:border-foreground/[0.04] hover:bg-slate-50 dark:hover:bg-foreground/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {r.company_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.domain}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={bandColor(r.score_band)}>
                            {r.score_band} · {r.intent_score}
                          </Badge>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-slate-500 max-w-md">
                          <p className="line-clamp-2">{r.ai_summary}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {response.errors && response.errors.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 text-sm">Failed to score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {response.errors.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border border-red-500/10 px-4 py-2">
                    <span className="text-slate-400">{e.domain}</span>
                    <span className="text-red-400 text-xs">{e.error}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
