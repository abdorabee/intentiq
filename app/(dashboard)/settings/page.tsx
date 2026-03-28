"use client";

import { useState, useEffect } from "react";
import { Check, Save, Loader2, Settings } from "lucide-react";
import type { BusinessProfile } from "@/lib/types";

// ─── Profile Questions (mirrors onboarding steps) ────────────────────────────

interface ProfileField {
  id: keyof BusinessProfile;
  label: string;
  question: string;
  options: string[];
  multiSelect?: boolean;
}

const FIELDS: ProfileField[] = [
  {
    id: "product_category",
    label: "Product Category",
    question: "What best describes what you sell?",
    options: ["SaaS / Software", "Consulting / Services", "Hardware / Physical", "Marketplace / Platform"],
  },
  {
    id: "target_industries",
    label: "Target Industries",
    question: "Which industries do you primarily sell into?",
    options: ["Technology", "Financial Services", "Healthcare", "E-commerce / Retail", "Manufacturing", "Education"],
    multiSelect: true,
  },
  {
    id: "company_size",
    label: "Ideal Company Size",
    question: "What size companies are your ideal customers?",
    options: ["Startups (1-50)", "SMB (51-200)", "Mid-Market (201-1000)", "Enterprise (1000+)"],
  },
  {
    id: "buyer_role",
    label: "Primary Buyer",
    question: "Who is your primary buyer?",
    options: ["C-Suite / Founders", "VP / Director", "Manager / Team Lead", "Individual Contributor"],
  },
  {
    id: "sales_motion",
    label: "Sales Motion",
    question: "How does your team primarily sell?",
    options: ["Outbound (cold outreach)", "Inbound (content/SEO/ads)", "Product-Led Growth", "Channel / Partners"],
  },
  {
    id: "deal_size",
    label: "Deal Size",
    question: "What's your typical deal size?",
    options: ["< $5K", "$5K - $25K", "$25K - $100K", "$100K+"],
  },
  {
    id: "sales_cycle",
    label: "Sales Cycle",
    question: "How long is your typical sales cycle?",
    options: ["< 2 weeks", "2-4 weeks", "1-3 months", "3+ months"],
  },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [draft, setDraft] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      setProfile({ ...draft });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
        <div className="border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-slate-500">No business profile found. Complete onboarding first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Settings className="h-4 w-4 text-cyan-500" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Business Profile</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wide">
            This profile shapes how IntentIQ scores and analyzes companies for you.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.05em] transition-all duration-200 border cursor-pointer ${
            saved
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : hasChanges
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
              : "bg-slate-100 dark:bg-white/[0.03] text-slate-400 border-slate-200 dark:border-white/[0.08] opacity-50 cursor-not-allowed"
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

      {/* Profile Cards */}
      <div className="space-y-4">
        {FIELDS.map((field, idx) => (
          <div
            key={field.id}
            className="border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-0.5">{field.label}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{field.question}</p>
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
                        : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]"
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
  );
}
