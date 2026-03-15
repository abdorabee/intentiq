"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Plus, AlertCircle } from "lucide-react";
import type { WatchlistEntry } from "@/lib/types";

type FilterTab = "ALL" | "HOT" | "WARM" | "COLD";

const bandClass = (band: string | null) => {
  if (band === "HOT")  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (band === "WARM") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  const [addDomain, setAddDomain] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.watchlist ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  async function handleAdd() {
    if (!addDomain.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: addDomain.trim(), company_name: addCompany.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWatchlist((prev) => [data, ...prev]);
      setAddDomain("");
      setAddCompany("");
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(domain: string) {
    setRemoving(domain);
    try {
      await fetch(`/api/dashboard/watchlist?domain=${encodeURIComponent(domain)}`, { method: "DELETE" });
      setWatchlist((prev) => prev.filter((w) => w.domain !== domain));
    } finally {
      setRemoving(null);
    }
  }

  const counts = {
    ALL:  watchlist.length,
    HOT:  watchlist.filter((w) => w.score_band === "HOT").length,
    WARM: watchlist.filter((w) => w.score_band === "WARM").length,
    COLD: watchlist.filter((w) => !w.score_band || w.score_band === "COLD").length,
  };

  const filtered = activeTab === "ALL"
    ? watchlist
    : activeTab === "COLD"
    ? watchlist.filter((w) => !w.score_band || w.score_band === "COLD")
    : watchlist.filter((w) => w.score_band === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Watchlist</h1>
        <p className="text-slate-400 mt-1">Companies you&apos;re monitoring — re-scored weekly.</p>
      </div>

      {/* Add Company Form */}
      <Card className="border-white/[0.08]">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-base">Add Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="acme.com"
              value={addDomain}
              onChange={(e) => setAddDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 min-w-[160px] bg-white/[0.05] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50"
            />
            <Input
              placeholder="Company name (optional)"
              value={addCompany}
              onChange={(e) => setAddCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 min-w-[160px] bg-white/[0.05] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50"
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !addDomain.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 rounded-full gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {adding ? "Adding…" : "Add to Watchlist"}
            </Button>
          </div>
          {addError && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {addError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist Table */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-slate-100">
              Monitored Companies
            </CardTitle>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
              <TabsList className="bg-white/[0.05] border border-white/[0.08]">
                {(["ALL", "HOT", "WARM", "COLD"] as FilterTab[]).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="text-xs data-[state=active]:bg-white/[0.1] data-[state=active]:text-slate-100 text-slate-500 gap-1.5"
                  >
                    {tab}
                    <span className="font-mono text-[10px] opacity-60">{counts[tab]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 py-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
              <Eye className="h-12 w-12 opacity-20" />
              <p className="text-sm text-slate-500">
                {activeTab === "ALL"
                  ? "No companies in your watchlist yet."
                  : `No ${activeTab} companies.`}
              </p>
              {activeTab === "ALL" && (
                <p className="text-xs text-slate-600">Add a domain above to start monitoring.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Company</TableHead>
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Domain</TableHead>
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Score</TableHead>
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Band</TableHead>
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Last Scored</TableHead>
                  <TableHead className="text-slate-500 text-xs uppercase tracking-wide w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="font-medium text-slate-200">{item.company_name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{item.domain}</TableCell>
                    <TableCell className="font-bold text-slate-100">{item.score ?? "—"}</TableCell>
                    <TableCell>
                      {item.score_band ? (
                        <Badge className={`rounded-full text-xs ${bandClass(item.score_band)}`}>
                          {item.score_band}
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {item.last_scored ? new Date(item.last_scored).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleRemove(item.domain)}
                        disabled={removing === item.domain}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                        aria-label={`Remove ${item.company_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
