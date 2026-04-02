"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DbAutopilotRun, DbAutopilotAction } from "@/lib/types";

const statusBadge = (status: string) => {
  switch (status) {
    case "completed": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "failed": return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "partial": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    default: return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";
  }
};

interface RunHistoryProps {
  runs: DbAutopilotRun[];
}

export default function RunHistory({ runs }: RunHistoryProps) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [actions, setActions] = useState<DbAutopilotAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const toggleRun = useCallback(async (runId: string) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      setActions([]);
      return;
    }
    setExpandedRun(runId);
    setLoadingActions(true);
    try {
      const res = await fetch(`/api/autopilot/runs/${runId}`);
      const data = await res.json();
      setActions(data.actions ?? []);
    } finally {
      setLoadingActions(false);
    }
  }, [expandedRun]);

  if (runs.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardContent className="py-8">
          <p className="text-center text-sm text-slate-500">No runs yet. Workflows run on their configured schedule.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100 text-base">Recent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide w-8" />
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Checked</TableHead>
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Triggered</TableHead>
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Credits</TableHead>
              <TableHead className="text-slate-500 text-xs uppercase tracking-wide">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <>
                <TableRow
                  key={run.id}
                  className="border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => toggleRun(run.id)}
                >
                  <TableCell className="text-slate-500">
                    {expandedRun === run.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusBadge(run.status)}`}>{run.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{run.companies_checked}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{run.companies_triggered}</TableCell>
                  <TableCell className="text-slate-500">{run.credits_used}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{new Date(run.started_at).toLocaleString()}</TableCell>
                </TableRow>
                {expandedRun === run.id && (
                  <TableRow key={`${run.id}-detail`} className="border-slate-100 dark:border-white/[0.04]">
                    <TableCell colSpan={6} className="bg-slate-50/50 dark:bg-white/[0.01]">
                      {loadingActions ? (
                        <p className="text-sm text-slate-500 py-2">Loading actions...</p>
                      ) : actions.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">No actions triggered in this run.</p>
                      ) : (
                        <div className="space-y-2 py-1">
                          {actions.map((action) => (
                            <div key={action.id} className="flex items-center gap-3 text-xs px-2 py-1.5 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                              <span className="font-medium text-slate-700 dark:text-slate-200 min-w-[120px]">{action.company_name}</span>
                              <span className="text-slate-500">{action.domain}</span>
                              <span className="text-slate-400">
                                {action.old_score ?? "?"} → {action.new_score}
                              </span>
                              <Badge className={`text-[10px] ${statusBadge(action.action_status)}`}>{action.action_type}</Badge>
                              <span className="text-slate-500 ml-auto truncate max-w-[200px]">{action.trigger_reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
