"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  RefreshCw,
  ExternalLink,
  Columns3,
  Check,
} from "lucide-react";
import type { PipelineCompany } from "@/app/api/dashboard/pipeline/route";

type StageKey = "cold" | "warming" | "hot" | "engaged" | "converted";

const STAGE_CONFIG: Record<StageKey, {
  label: string;
  desc: string;
  headerClass: string;
  titleClass: string;
  dotClass: string;
  scoreClass: string;
  badgeClass: string;
}> = {
  cold: {
    label: "COLD",
    desc: "Nurture",
    headerClass: "border-slate-500/30 bg-white/[0.03]",
    titleClass: "text-slate-400",
    dotClass: "bg-slate-500",
    scoreClass: "text-slate-300",
    badgeClass: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  },
  warming: {
    label: "WARMING",
    desc: "Follow Up",
    headerClass: "border-amber-500/30 bg-amber-500/10",
    titleClass: "text-amber-400",
    dotClass: "bg-amber-400",
    scoreClass: "text-amber-400",
    badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  },
  hot: {
    label: "HOT",
    desc: "Act Now",
    headerClass: "border-emerald-500/30 bg-emerald-500/10",
    titleClass: "text-emerald-400",
    dotClass: "bg-emerald-400",
    scoreClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  },
  engaged: {
    label: "ENGAGED",
    desc: "In Outreach",
    headerClass: "border-cyan-500/30 bg-cyan-500/10",
    titleClass: "text-cyan-400",
    dotClass: "bg-cyan-400",
    scoreClass: "text-cyan-400",
    badgeClass: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  },
  converted: {
    label: "CONVERTED",
    desc: "Won",
    headerClass: "border-violet-500/30 bg-violet-500/10",
    titleClass: "text-violet-400",
    dotClass: "bg-violet-400",
    scoreClass: "text-violet-400",
    badgeClass: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  },
};

const STAGE_ORDER: StageKey[] = ["cold", "warming", "hot", "engaged", "converted"];

const urgencyConfig = (urgency: string | null) => {
  if (urgency === "act-now")    return "bg-red-500/15 text-red-400 border-red-500/30";
  if (urgency === "this-week")  return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (urgency === "this-month") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-slate-500/15 text-slate-400 border-slate-500/30";
};

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) return null;
  if (trend > 0) return (
    <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
      <TrendingUp className="h-3 w-3" />+{trend}
    </span>
  );
  if (trend < 0) return (
    <span className="flex items-center gap-0.5 text-xs text-red-400 font-medium">
      <TrendingDown className="h-3 w-3" />{trend}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-xs text-slate-500 font-medium">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

function CompanyCard({
  company,
  stage,
  onSelect,
  onRescore,
  onStageChange,
  rescoring,
}: {
  company: PipelineCompany;
  stage: StageKey;
  onSelect: (c: PipelineCompany) => void;
  onRescore: (domain: string) => void;
  onStageChange: (domain: string, stage: StageKey) => void;
  rescoring: string | null;
}) {
  const [emailCopied, setEmailCopied] = useState(false);
  const cfg = STAGE_CONFIG[stage];

  function handleCopyEmail(e: React.MouseEvent) {
    e.stopPropagation();
    const text = [company.email_subject, company.talk_track].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  const isRescoring = rescoring === company.domain;
  const currentIdx = STAGE_ORDER.indexOf(stage);
  const nextStage = currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null;

  return (
    <div
      onClick={() => onSelect(company)}
      className="border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] p-4 space-y-3 cursor-pointer transition-all duration-200 hover:border-white/[0.12]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-100 text-sm truncate">{company.company_name}</p>
          <p className="text-xs text-slate-500 truncate">{company.domain}</p>
        </div>
        <span className={`text-xl font-black shrink-0 ${cfg.scoreClass}`}>{company.score ?? "—"}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <TrendBadge trend={company.trend} />
        {company.urgency && (
          <span className={`text-[10px] px-2 py-0.5 border font-medium ${urgencyConfig(company.urgency)}`}>
            {company.urgency}
          </span>
        )}
      </div>

      {company.key_triggers && company.key_triggers.length > 0 && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {company.key_triggers[0]}
        </p>
      )}

      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyEmail}
          disabled={!company.email_subject && !company.talk_track}
          className="flex-1 h-7 text-xs border-white/[0.10] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer gap-1"
        >
          {emailCopied ? <><Check className="h-3 w-3" />Copied!</> : <><Mail className="h-3 w-3" />Email</>}
        </Button>
        {nextStage && stage !== "converted" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onStageChange(company.domain, nextStage); }}
            className="flex-1 h-7 text-xs border-white/[0.10] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer gap-1"
          >
            → {STAGE_CONFIG[nextStage].label}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onRescore(company.domain); }}
            disabled={isRescoring}
            className="flex-1 h-7 text-xs border-white/[0.10] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRescoring ? "animate-spin" : ""}`} />
            {isRescoring ? "Scoring…" : "Re-score"}
          </Button>
        )}
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  companies,
  onSelect,
  onRescore,
  onStageChange,
  rescoring,
}: {
  stage: StageKey;
  companies: PipelineCompany[];
  onSelect: (c: PipelineCompany) => void;
  onRescore: (domain: string) => void;
  onStageChange: (domain: string, stage: StageKey) => void;
  rescoring: string | null;
}) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className={`border px-4 py-3 flex items-center justify-between ${cfg.headerClass}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dotClass} ${stage === "hot" ? "animate-pulse" : ""}`} />
          <span className={`font-bold text-sm ${cfg.titleClass}`}>{cfg.label}</span>
          <span className="text-xs text-slate-500">{cfg.desc}</span>
        </div>
        <span className="text-xs font-mono text-slate-500">{companies.length}</span>
      </div>

      <div className="space-y-2">
        {companies.length === 0 ? (
          <div className="border border-dashed border-white/[0.06] px-4 py-8 text-center">
            <p className="text-xs text-slate-600">No {cfg.label.toLowerCase()} companies</p>
          </div>
        ) : (
          companies.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              stage={stage}
              onSelect={onSelect}
              onRescore={onRescore}
              onStageChange={onStageChange}
              rescoring={rescoring}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [companies, setCompanies] = useState<PipelineCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PipelineCompany | null>(null);
  const [rescoring, setRescoring] = useState<string | null>(null);
  const [dialogEmailCopied, setDialogEmailCopied] = useState(false);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/pipeline");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  async function handleRescore(domain: string) {
    setRescoring(domain);
    try {
      const res = await fetch(`/api/v1/score?domain=${encodeURIComponent(domain)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCompanies((prev) =>
        prev.map((c) =>
          c.domain === domain
            ? {
                ...c,
                score: data.intent_score,
                score_band: data.score_band,
                trend: c.score != null ? data.intent_score - c.score : null,
                email_subject: data.email_subject ?? c.email_subject,
                talk_track: data.talk_track ?? c.talk_track,
                ai_summary: data.ai_summary ?? c.ai_summary,
                key_triggers: data.key_triggers ?? c.key_triggers,
                urgency: data.urgency ?? c.urgency,
                last_scored: new Date().toISOString(),
              }
            : c
        )
      );
      setSelected((prev) =>
        prev?.domain === domain
          ? {
              ...prev,
              score: data.intent_score,
              score_band: data.score_band,
              trend: prev.score != null ? data.intent_score - prev.score : null,
              email_subject: data.email_subject ?? prev.email_subject,
              talk_track: data.talk_track ?? prev.talk_track,
              ai_summary: data.ai_summary ?? prev.ai_summary,
              key_triggers: data.key_triggers ?? prev.key_triggers,
              urgency: data.urgency ?? prev.urgency,
            }
          : prev
      );
    } finally {
      setRescoring(null);
    }
  }

  async function handleStageChange(domain: string, stage: StageKey) {
    try {
      const res = await fetch("/api/dashboard/pipeline/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, stage }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.domain === domain ? { ...c, pipeline_stage: stage } : c))
        );
      }
    } catch { /* ignore */ }
  }

  function handleCopyDialogEmail() {
    if (!selected) return;
    const text = [selected.email_subject, selected.talk_track].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setDialogEmailCopied(true);
    setTimeout(() => setDialogEmailCopied(false), 2000);
  }

  // Group by pipeline_stage
  const grouped: Record<StageKey, PipelineCompany[]> = { cold: [], warming: [], hot: [], engaged: [], converted: [] };
  for (const c of companies) {
    const stage = (c.pipeline_stage ?? "cold") as StageKey;
    if (grouped[stage]) {
      grouped[stage].push(c);
    } else {
      grouped.cold.push(c);
    }
  }
  // Sort each group by score descending
  for (const stage of STAGE_ORDER) {
    grouped[stage].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const selectedStage = selected ? ((selected.pipeline_stage ?? "cold") as StageKey) : "cold";
  const selectedCfg = selected ? STAGE_CONFIG[selectedStage] : null;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[PIPELINE]</span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Intent Pipeline</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">
          Track companies through intent stages — from cold signals to converted deals.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-slate-500 text-sm">Loading pipeline…</div>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Columns3 className="h-14 w-14 text-slate-700" />
          <div>
            <p className="text-slate-500 text-sm tracking-[0.05em] font-medium">Your pipeline is empty.</p>
            <p className="text-slate-600 text-sm mt-1">Add companies to your watchlist to see them here.</p>
          </div>
          <Link
            href="/watchlist"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Go to Watchlist →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
          {STAGE_ORDER.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              companies={grouped[stage]}
              onSelect={setSelected}
              onRescore={handleRescore}
              onStageChange={handleStageChange}
              rescoring={rescoring}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setDialogEmailCopied(false); } }}>
        <DialogContent className="border-white/[0.08] bg-[#0c1122] max-w-lg">
          {selected && selectedCfg && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap pr-6">
                  <DialogTitle className="text-slate-100 text-lg">{selected.company_name}</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${selectedCfg.badgeClass}`}>{selectedCfg.label}</Badge>
                    <span className={`text-2xl font-black ${selectedCfg.scoreClass}`}>{selected.score ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  <span>{selected.domain}</span>
                  <TrendBadge trend={selected.trend} />
                  {selected.urgency && (
                    <span className={`text-[10px] px-2 py-0.5 border font-medium ${urgencyConfig(selected.urgency)}`}>
                      {selected.urgency}
                    </span>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Stage selector */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Pipeline Stage</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {STAGE_ORDER.map((s) => {
                      const sCfg = STAGE_CONFIG[s];
                      const isActive = selectedStage === s;
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            handleStageChange(selected.domain, s);
                            setSelected({ ...selected, pipeline_stage: s });
                          }}
                          className={`text-[10px] px-2.5 py-1 border transition-colors cursor-pointer ${
                            isActive ? sCfg.badgeClass : "border-white/[0.08] text-slate-600 hover:text-slate-400 hover:border-white/[0.15]"
                          }`}
                        >
                          {sCfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selected.ai_summary && (
                  <div className="bg-white/[0.04] border border-white/[0.07] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">AI Analysis</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{selected.ai_summary}</p>
                  </div>
                )}

                {selected.key_triggers && selected.key_triggers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Key Triggers</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.key_triggers.map((t, i) => (
                        <span key={i} className="text-xs bg-white/[0.06] text-slate-300 px-2.5 py-1 border border-white/[0.08]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.email_subject && (
                  <div className="border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Email Subject</p>
                    <p className="text-sm font-mono text-slate-300">{selected.email_subject}</p>
                  </div>
                )}

                {selected.talk_track && (
                  <div className="border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Talk Track</p>
                    <p className="text-sm italic text-slate-400">{selected.talk_track}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap pt-1">
                  <Button
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white border-0 gap-1.5 cursor-pointer"
                    onClick={handleCopyDialogEmail}
                    disabled={!selected.email_subject && !selected.talk_track}
                  >
                    {dialogEmailCopied ? <><Check className="h-4 w-4" />Copied!</> : <><Mail className="h-4 w-4" />Copy Email + Talk Track</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/[0.10] text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] cursor-pointer gap-1.5"
                    asChild
                  >
                    <a
                      href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selected.company_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
