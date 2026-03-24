"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, ChevronLeft, ChevronRight, Copy, Check, X } from "lucide-react";
import type { DbScore, ScoreBand, BuyingStage, UrgencyLevel, SignalSet } from "@/lib/types";

const bandClass = (band: ScoreBand) => {
  if (band === "HOT")  return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30";
  if (band === "WARM") return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30";
  return "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30";
};

const bandScoreClass = (band: ScoreBand) =>
  band === "HOT" ? "text-emerald-600 dark:text-emerald-400" : band === "WARM" ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300";

const urgencyClass = (u: UrgencyLevel | null) => {
  if (u === "act-now")    return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30";
  if (u === "this-week")  return "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30";
  if (u === "this-month") return "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30";
  return "bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30";
};

const stageLabel = (s: BuyingStage | null) => {
  if (s === "decision")     return "Decision";
  if (s === "consideration") return "Consideration";
  return "Awareness";
};

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  funding:    { label: "Funding",    color: "bg-emerald-500" },
  hiring:     { label: "Hiring",     color: "bg-blue-500" },
  news:       { label: "News",       color: "bg-purple-500" },
  technology: { label: "Technology", color: "bg-amber-500" },
  web:        { label: "Web",        color: "bg-cyan-500" },
};

function SignalBar({ signalKey, signals }: { signalKey: string; signals: SignalSet }) {
  const sig = signals[signalKey as keyof SignalSet];
  if (!sig || typeof sig === "string") return null;
  const info = SIGNAL_LABELS[signalKey];
  const pct = Math.round((sig.score / sig.max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{info.label}</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">{sig.score}/{sig.max}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${info.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{sig.detail}</p>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</h4>
      <div
        className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] px-3 py-2 rounded cursor-pointer group"
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      >
        <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{value}</span>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />}
      </div>
    </div>
  );
}

export default function ScoreHistoryPage() {
  const [rows, setRows] = useState<DbScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<DbScore | null>(null);

  const fetchScores = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/dashboard/scores?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.scores ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScores(page, query); }, [fetchScores, page, query]);

  // Reset to page 1 on search
  function handleSearch(val: string) {
    setQuery(val);
    setPage(1);
  }

  function exportCSV() {
    const header = "Company,Domain,Score,Band,Urgency,Stage,Scored At";
    const csvRows = rows.map((r) =>
      [
        `"${r.company_name}"`,
        r.domain,
        r.score,
        r.score_band,
        r.urgency ?? "",
        r.buying_stage ?? "",
        new Date(r.created_at).toISOString(),
      ].join(",")
    );
    const blob = new Blob([[header, ...csvRows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "intentiq-history.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[HISTORY]</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Score History</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">All companies you&apos;ve scored — most recent first.</p>
      </div>

      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-slate-800 dark:text-slate-100">
              Scores {total > 0 && `(${total})`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search company or domain…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-52 bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 text-sm h-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={rows.length === 0}
                className="border-slate-300 dark:border-white/[0.12] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] gap-1.5 cursor-pointer h-8"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 py-4">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              {query ? "No results match your search." : "No scores yet. Use the Score Explorer to score your first company."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Company</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Score</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Band</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Stage</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Urgency</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Key Triggers</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">AI Summary</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Scored</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => setSelected(row)}
                        className="border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <TableCell>
                          <div className="font-medium text-slate-700 dark:text-slate-200">{row.company_name}</div>
                          <div className="text-xs text-slate-500">{row.domain}</div>
                        </TableCell>

                        <TableCell>
                          <span className={`text-2xl font-black ${bandScoreClass(row.score_band)}`}>
                            {row.score}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge className={`text-xs ${bandClass(row.score_band)}`}>
                            {row.score_band}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{stageLabel(row.buying_stage)}</span>
                        </TableCell>

                        <TableCell>
                          {row.urgency && (
                            <span className={`text-xs font-medium px-2 py-1 ${urgencyClass(row.urgency)}`}>
                              {row.urgency}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {(row.key_triggers ?? []).slice(0, 2).map((t, i) => (
                              <span key={i} className="text-xs bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 truncate max-w-[180px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="max-w-[260px]">
                          <p className="text-xs text-slate-500 line-clamp-2">{row.ai_summary}</p>
                        </TableCell>

                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <span className="text-xs text-slate-500">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="border-slate-200 dark:border-white/[0.10] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.05] h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="border-slate-200 dark:border-white/[0.10] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.05] h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden bg-white dark:bg-[#0a1628] border-slate-200 dark:border-white/[0.10] shadow-2xl shadow-black/10 dark:shadow-black/40">
          {selected && (
            <>
              {/* Header — fixed at top with gradient accent */}
              <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-transparent dark:from-cyan-500/[0.06]" />
                <DialogHeader className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{selected.company_name}</DialogTitle>
                      <p className="text-sm text-slate-500 mt-0.5 font-mono">{selected.domain}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`text-4xl font-black score-display ${bandScoreClass(selected.score_band)}`}>
                        {selected.score}
                      </div>
                      <Badge className={`text-[10px] px-2 py-0 ${bandClass(selected.score_band)}`}>
                        {selected.score_band}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 rounded-sm font-medium">
                      {stageLabel(selected.buying_stage)}
                    </span>
                    {selected.urgency && (
                      <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-sm ${urgencyClass(selected.urgency)}`}>
                        {selected.urgency}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto tabular-nums">
                      {new Date(selected.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </DialogHeader>
              </div>

              {/* Scrollable content with thin scrollbar */}
              <div className="px-6 py-5 overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(85vh - 140px)" }}>
                <div className="space-y-6">

                  {/* AI Summary — featured section */}
                  <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
                    <h4 className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.15em] mb-2">AI Summary</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selected.ai_summary}</p>
                  </div>

                  {/* Why Now + Recommended Action — side by side on wide screens */}
                  <div className="grid gap-4 sm:grid-cols-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    {selected.why_now && (
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg p-4">
                        <h4 className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] mb-2">Why Now</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selected.why_now}</p>
                      </div>
                    )}
                    {selected.recommended_action && (
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg p-4">
                        <h4 className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] mb-2">Recommended Action</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selected.recommended_action}</p>
                      </div>
                    )}
                  </div>

                  {/* Key Triggers */}
                  {(selected.key_triggers ?? []).length > 0 && (
                    <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
                      <h4 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">Key Triggers</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selected.key_triggers ?? []).map((t, i) => (
                          <span key={i} className="text-xs bg-cyan-50 dark:bg-cyan-500/[0.08] text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 px-3 py-1.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sales Tools — Email + Talk Track */}
                  <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    <h4 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-3">Sales Tools</h4>
                    <div className="space-y-3">
                      {selected.email_subject && <CopyField label="Email Subject Line" value={selected.email_subject} />}
                      {selected.talk_track && (
                        <div>
                          <h4 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Talk Track</h4>
                          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg p-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">&ldquo;{selected.talk_track}&rdquo;</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signal Breakdown */}
                  {selected.signals && (
                    <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
                      <h4 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-3">Signal Breakdown</h4>
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] rounded-lg p-4 space-y-4">
                        {(["funding", "hiring", "news", "technology", "web"] as const).map((key) => (
                          <SignalBar key={key} signalKey={key} signals={selected.signals} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
