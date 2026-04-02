"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Activity } from "lucide-react";
import WorkflowBuilder from "@/components/autopilot/workflow-builder";
import WorkflowCard from "@/components/autopilot/workflow-card";
import RunHistory from "@/components/autopilot/run-history";
import type { DbAutopilotWorkflow, DbAutopilotRun, DbAutopilotAction } from "@/lib/types";

export default function AutopilotPage() {
  const [workflows, setWorkflows] = useState<DbAutopilotWorkflow[]>([]);
  const [runs, setRuns] = useState<DbAutopilotRun[]>([]);
  const [recentActions, setRecentActions] = useState<DbAutopilotAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<DbAutopilotWorkflow | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, runsRes] = await Promise.all([
        fetch("/api/autopilot/workflows"),
        fetch("/api/autopilot/runs"),
      ]);

      if (wfRes.ok) {
        const data = await wfRes.json();
        setWorkflows(data.workflows ?? []);
      }
      if (runsRes.ok) {
        const data = await runsRes.json();
        const allRuns: DbAutopilotRun[] = data.runs ?? [];
        setRuns(allRuns);

        // Fetch actions from the most recent run for the activity feed
        if (allRuns.length > 0) {
          const latestRes = await fetch(`/api/autopilot/runs/${allRuns[0].id}`);
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            setRecentActions(latestData.actions ?? []);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleToggle(id: string, enabled: boolean) {
    await fetch(`/api/autopilot/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: enabled }),
    });
    setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, is_enabled: enabled } : w));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/autopilot/workflows/${id}`, { method: "DELETE" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function handleEdit(workflow: DbAutopilotWorkflow) {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  }

  function handleBuilderSave() {
    setShowBuilder(false);
    setEditingWorkflow(undefined);
    fetchData();
  }

  function handleBuilderCancel() {
    setShowBuilder(false);
    setEditingWorkflow(undefined);
  }

  const actionBandClass = (band: string | null) => {
    if (band === "HOT")  return "text-emerald-400";
    if (band === "WARM") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[AUTOPILOT]</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
            Signal-Triggered Workflows
          </h1>
          <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">
            Automate scoring, alerts, and actions when your companies&apos; intent signals change.
          </p>
        </div>
        {!showBuilder && (
          <Button
            onClick={() => { setEditingWorkflow(undefined); setShowBuilder(true); }}
            className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        )}
      </div>

      {/* Workflow Builder */}
      {showBuilder && (
        <WorkflowBuilder
          workflow={editingWorkflow}
          onSave={handleBuilderSave}
          onCancel={handleBuilderCancel}
        />
      )}

      {/* Workflows Grid */}
      {loading ? (
        <p className="text-sm text-slate-500 py-4">Loading workflows...</p>
      ) : workflows.length === 0 && !showBuilder ? (
        <Card className="border-slate-200 dark:border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Zap className="h-12 w-12 text-slate-400/20" />
            <p className="text-sm text-slate-500">No workflows yet.</p>
            <p className="text-xs text-slate-600 dark:text-slate-500">Create your first workflow to start automating your sales intelligence.</p>
            <Button
              onClick={() => setShowBuilder(true)}
              variant="outline"
              size="sm"
              className="mt-2 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {workflows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Activity Feed */}
      {recentActions.length > 0 && (
        <Card className="border-slate-200 dark:border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActions.slice(0, 20).map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 text-xs p-2 border border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <span className={`font-bold text-sm ${actionBandClass(action.new_band)}`}>
                    {action.new_score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{action.company_name}</span>
                    <span className="text-slate-500 ml-1.5">({action.domain})</span>
                  </div>
                  <Badge className="text-[10px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                    {action.action_type.replace("_", " ")}
                  </Badge>
                  <span className="text-slate-500 text-[10px] shrink-0">
                    {new Date(action.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run History */}
      {runs.length > 0 && <RunHistory runs={runs} />}
    </div>
  );
}
