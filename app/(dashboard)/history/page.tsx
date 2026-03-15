"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import type { DbScore, ScoreBand, BuyingStage, UrgencyLevel } from "@/lib/types";

const bandClass = (band: ScoreBand) => {
  if (band === "HOT")  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (band === "WARM") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
};

const bandScoreClass = (band: ScoreBand) =>
  band === "HOT" ? "text-emerald-400" : band === "WARM" ? "text-amber-400" : "text-slate-300";

const urgencyClass = (u: UrgencyLevel | null) => {
  if (u === "act-now")    return "bg-red-500/15 text-red-400 border border-red-500/30";
  if (u === "this-week")  return "bg-orange-500/15 text-orange-400 border border-orange-500/30";
  if (u === "this-month") return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
};

const stageLabel = (s: BuyingStage | null) => {
  if (s === "decision")     return "Decision";
  if (s === "consideration") return "Consideration";
  return "Awareness";
};

export default function ScoreHistoryPage() {
  const [rows, setRows] = useState<DbScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/scores");
      if (res.ok) {
        const data = await res.json();
        setRows(data.scores ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) => r.company_name.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q)
    );
  }, [rows, query]);

  function exportCSV() {
    const header = "Company,Domain,Score,Band,Urgency,Stage,Scored At";
    const csvRows = filtered.map((r) =>
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
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Score History</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">All companies you&apos;ve scored — most recent first.</p>
      </div>

      <Card className="border-white/[0.08]">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-slate-100">
              Scores {filtered.length > 0 && `(${filtered.length})`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search company or domain…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-52 bg-white/[0.05] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 text-sm h-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={filtered.length === 0}
                className="border-white/[0.12] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] gap-1.5 cursor-pointer h-8"
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
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              {query ? "No results match your search." : "No scores yet. Use the Score Explorer to score your first company."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
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
                  {filtered.map((row) => (
                    <TableRow key={row.id} className="border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <TableCell>
                        <div className="font-medium text-slate-200">{row.company_name}</div>
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
                        <span className="text-sm text-slate-400">{stageLabel(row.buying_stage)}</span>
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
                            <span key={i} className="text-xs bg-white/[0.06] text-slate-400 border border-white/[0.08] px-2 py-0.5 truncate max-w-[180px]">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
