"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/settings-section";
import { useSettingsSave } from "@/components/settings/use-settings-save";
import type { NotificationPreferences } from "@/lib/types";

const DEFAULT_PREFS: NotificationPreferences = {
  notify_weekly_digest: true,
  notify_credit_low: true,
  notify_hot_signal: true,
};

const ROWS: Array<{ id: keyof NotificationPreferences; label: string; description: string }> = [
  {
    id: "notify_weekly_digest",
    label: "Weekly digest",
    description: "A Monday summary of score movement across your watchlist.",
  },
  {
    id: "notify_credit_low",
    label: "Low credit warning",
    description: "Email when your balance drops below 10% of your monthly allowance.",
  },
  {
    id: "notify_hot_signal",
    label: "Hot signal alerts",
    description: "Email when a watchlisted account crosses into the HOT band.",
  },
];

export function NotificationsTab() {
  const [loading, setLoading] = useState(true);
  const [serverState, setServerState] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const { draft, setDraft, saving, saved, error, hasChanges, save } = useSettingsSave<NotificationPreferences>({
    serverState,
    onSave: async (next) => {
      const res = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Failed to save notification preferences");
    },
  });

  useEffect(() => {
    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((data: NotificationPreferences) => {
        setServerState(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Re-sync draft once the server state loads (avoids overwriting user edits mid-flight).
  useEffect(() => {
    if (!loading) setDraft(serverState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, serverState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <SettingsSection
      title="Notifications"
      description="Choose which emails VesperWise sends you."
      footer={<span>Preferences are saved now; email delivery is being wired up.</span>}
      actions={
        <button
          onClick={save}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.05em] transition-all duration-200 border cursor-pointer ${
            saved
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : hasChanges
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
              : "bg-slate-100 dark:bg-foreground/[0.03] text-slate-400 border-slate-200 dark:border-foreground/[0.08] opacity-50 cursor-not-allowed"
          }`}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save changes"}
        </button>
      }
    >
      {error && (
        <p role="alert" className="mb-3 text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4 py-2">
            <div>
              <Label htmlFor={row.id}>{row.label}</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.description}</p>
            </div>
            <Switch
              id={row.id}
              checked={draft[row.id]}
              onCheckedChange={(checked) => setDraft({ ...draft, [row.id]: checked })}
            />
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
