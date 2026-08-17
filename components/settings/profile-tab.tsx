"use client";

import { useEffect, useState } from "react";
import { Check, Save, Loader2, Sparkles } from "lucide-react";
import type { BusinessProfile, DbUser } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/settings/settings-section";
import { FIELDS, buildSummary } from "@/components/settings/icp-fields";

interface AccountIdentity {
  name: string;
  email: string;
  plan: DbUser["plan"];
  memberSince: string | null;
}

interface ProfileTabProps {
  identity: AccountIdentity;
}

function IcpFitExplainer() {
  return (
    <div className="border border-cyan-500/20 bg-cyan-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">ICP Fit Scoring</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Every company you score gets an <span className="text-cyan-400 font-medium">ICP Fit %</span> alongside its intent score — showing how well that company matches your profile below.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Strong ICP Fit", range: "80–100%", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
              { label: "Good ICP Fit", range: "60–79%", cls: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
              { label: "Partial Fit", range: "40–59%", cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
              { label: "Weak Fit", range: "0–39%", cls: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
            ].map((tier) => (
              <span key={tier.label} className={`text-[10px] px-2 py-1 border font-medium ${tier.cls}`}>
                {tier.label} <span className="opacity-60">{tier.range}</span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            Fit uses verified firmographics only: industry alignment contributes 60% and employee-range alignment contributes 40%. It remains unavailable when either your profile or the company data is insufficient.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProfileTab({ identity }: ProfileTabProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [draft, setDraft] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.business_profile ?? null);
        setDraft(data.business_profile ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(draft);

  async function handleSave() {
    if (!draft || !hasChanges) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile: draft }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save profile");
      }

      setProfile({ ...draft });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function updateField(fieldId: keyof BusinessProfile, value: string) {
    if (!draft) return;
    const field = FIELDS.find((f) => f.id === fieldId);
    if (field?.multiSelect) {
      const current = (draft[fieldId] as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setDraft({ ...draft, [fieldId]: updated });
    } else {
      setDraft({ ...draft, [fieldId]: value });
    }
  }

  function isSelected(fieldId: keyof BusinessProfile, value: string): boolean {
    if (!draft) return false;
    const current = draft[fieldId];
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="Account" description="Managed via your sign-in provider.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">Name</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{identity.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">Email</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{identity.email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">Plan</p>
            <Badge variant="outline" className="capitalize">{identity.plan}</Badge>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">Member since</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{identity.memberSince ?? "—"}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-4">
          Name, email, and password are managed by your sign-in provider — there&apos;s nothing to edit here yet.
        </p>
      </SettingsSection>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Business profile (ICP)</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            What VesperWise knows about your business — drives every score, recommendation, and ICP fit calculation.
          </p>
          {saveError && (
            <p role="alert" className="mt-2 text-xs text-red-500 dark:text-red-400">
              {saveError}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.05em] transition-all duration-200 border cursor-pointer ${
            saved
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : hasChanges
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
              : "bg-slate-100 dark:bg-foreground/[0.03] text-slate-400 border-slate-200 dark:border-foreground/[0.08] opacity-50 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        </div>
      ) : !profile ? (
        <div className="border border-slate-200 dark:border-foreground/[0.08] bg-slate-50 dark:bg-foreground/[0.02] p-8 text-center">
          <p className="text-sm text-slate-500">No business profile found. Complete onboarding first.</p>
        </div>
      ) : (
        <>
          <div className="border border-slate-200 dark:border-foreground/[0.08] bg-slate-50 dark:bg-foreground/[0.02] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1.5">Your ICP in plain English</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;{buildSummary(draft ?? profile)}&rdquo;
            </p>
          </div>

          <IcpFitExplainer />

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">Your ICP Profile</p>
            <div className="space-y-3">
              {FIELDS.map((field, idx) => (
                <div
                  key={field.id}
                  className="border border-slate-200 dark:border-foreground/[0.08] bg-white dark:bg-foreground/[0.02] animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-foreground/[0.06] flex items-center gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">{field.label}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{field.question}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const selected = isSelected(field.id, option);
                      return (
                        <button
                          key={option}
                          onClick={() => updateField(field.id, option)}
                          className={`px-3 py-1.5 text-xs tracking-[0.03em] transition-all duration-150 border cursor-pointer ${
                            selected
                              ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/40"
                              : "bg-slate-50 dark:bg-foreground/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-foreground/[0.08] hover:border-slate-300 dark:hover:border-foreground/[0.15]"
                          }`}
                        >
                          {selected && <Check className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
