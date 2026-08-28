"use client";

import { useState, useEffect } from "react";
import { Check, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BusinessProfile } from "@/lib/types";

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
    label: "What You Sell",
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

function buildSummary(profile: BusinessProfile): string {
  const parts: string[] = [];

  if (profile.product_category) parts.push(`You sell ${profile.product_category}`);

  if (profile.target_industries?.length) {
    const inds = profile.target_industries.slice(0, 2).join(" and ");
    const more = profile.target_industries.length > 2 ? ` (+${profile.target_industries.length - 2} more)` : "";
    parts.push(`to ${inds}${more} companies`);
  }

  if (profile.company_size) parts.push(`of ${profile.company_size} size`);
  if (profile.buyer_role) parts.push(`with ${profile.buyer_role} buyers`);
  if (profile.deal_size) parts.push(`at ${profile.deal_size} deals`);
  if (profile.sales_cycle) parts.push(`and ${profile.sales_cycle} sales cycles`);

  return parts.join(", ") + ".";
}

function IcpFitExplainer() {
  return (
    <div className="settings-callout">
      <p className="settings-callout-title">ICP fit scoring</p>
      <p>
        Every company you score gets an ICP Fit % alongside its intent score — showing how well that company matches this selling profile.
      </p>
      <div className="settings-fit-row">
        <span>Strong 80–100%</span>
        <span>Good 60–79%</span>
        <span>Partial 40–59%</span>
        <span>Weak 0–39%</span>
      </div>
      <p className="settings-callout-note">
        Fit uses verified firmographics only: industry alignment contributes 60% and employee-range alignment contributes 40%. It remains unavailable when either your profile or the company data is insufficient.
      </p>
    </div>
  );
}

export default function SellingProfilePage() {
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
      toast.success("Selling profile saved");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      setSaveError(message);
      toast.error(message);
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
      <div className="settings-loading" role="status" aria-live="polite">
        <Loader2 className="settings-spinner" aria-hidden />
        Loading selling profile
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="settings-sections">
        <header className="page-head">
          <div>
            <h1 className="page-title">Selling profile</h1>
            <p className="page-sub">Complete onboarding to define the ICP used for scoring.</p>
          </div>
        </header>
        <div className="settings-empty">
          <p>No business profile found. Complete onboarding first.</p>
        </div>
      </div>
    );
  }

  const summary = buildSummary(draft ?? profile);

  return (
    <div className="settings-sections">
      <header className="page-head">
        <div>
          <h1 className="page-title">Selling profile</h1>
          <p className="page-sub">
            What VesperWise knows about your business — drives every score, recommendation, and ICP fit calculation.
          </p>
          {saveError && (
            <p role="alert" className="settings-error">
              {saveError}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={saved ? "tb-btn outlined" : hasChanges ? "btn-primary" : "tb-btn outlined"}
        >
          {saving ? (
            <Loader2 className="ic settings-spinner" aria-hidden />
          ) : saved ? (
            <Check className="ic" aria-hidden />
          ) : (
            <Save className="ic" aria-hidden />
          )}
          {saved ? "Saved" : "Save changes"}
        </button>
      </header>

      <div className="settings-callout">
        <p className="settings-eyebrow">Your ICP in plain English</p>
        <p className="settings-summary">&ldquo;{summary}&rdquo;</p>
      </div>

      <IcpFitExplainer />

      <div className="settings-field-list">
        <p className="settings-eyebrow">Your ICP profile</p>
        {FIELDS.map((field) => (
          <section key={field.id} className="settings-field">
            <div className="settings-field-head">
              <p className="settings-eyebrow">{field.label}</p>
              <p>{field.question}</p>
            </div>
            <div className="settings-choice-list">
              {field.options.map((option) => {
                const selected = isSelected(field.id, option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField(field.id, option)}
                    className={`settings-choice${selected ? " active" : ""}`}
                    aria-pressed={selected}
                  >
                    {selected && <Check className="ic" aria-hidden />}
                    {option}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
