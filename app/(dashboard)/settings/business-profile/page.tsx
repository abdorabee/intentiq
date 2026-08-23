"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Check, Save, Loader2, Building2, Sparkles } from "lucide-react";
import type { BusinessProfile } from "@/lib/types";
import { profileUpdateSchema } from "@/lib/business-profile";

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

const EMPTY_PROFILE: BusinessProfile = {
  product_category: "",
  target_industries: [],
  company_size: "",
  buyer_role: "",
  sales_motion: "",
  deal_size: "",
  sales_cycle: "",
};

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
    <div className="border border-cyan-500/20 bg-cyan-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">ICP Fit Scoring</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Every company you score gets an <span className="text-cyan-400 font-medium">ICP Fit %</span> alongside its intent score — showing how well that company matches your business profile.
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

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [draft, setDraft] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Partial<Record<keyof BusinessProfile, string>>>({});
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const pendingLink = useRef<HTMLAnchorElement | null>(null);
  const pendingHistory = useRef(false);
  const navigationBypass = useRef(false);
  const restoringHistory = useRef(false);
  const navigationTrigger = useRef<HTMLElement | null>(null);
  const stayButton = useRef<HTMLButtonElement | null>(null);
  const discardButton = useRef<HTMLButtonElement | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/user/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Your business profile could not load.");
      const data = await response.json() as { business_profile?: BusinessProfile | null };
      const next = data.business_profile ?? EMPTY_PROFILE;
      setProfile(next);
      setDraft(next);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Your business profile could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(draft);
  const hasPendingCustomValue = Object.values(customValues).some((value) => Boolean(value?.trim()));
  const hasUnsavedChanges = hasChanges || hasPendingCustomValue;

  function openDiscardDialog(link: HTMLAnchorElement | null, fromHistory = false) {
    pendingLink.current = link;
    pendingHistory.current = fromHistory;
    navigationTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : link;
    setDiscardDialogOpen(true);
  }

  function closeDiscardDialog() {
    setDiscardDialogOpen(false);
    pendingLink.current = null;
    pendingHistory.current = false;
    queueMicrotask(() => navigationTrigger.current?.focus());
  }

  function discardAndNavigate() {
    setDiscardDialogOpen(false);
    navigationBypass.current = true;
    if (pendingHistory.current) {
      window.history.back();
    } else {
      pendingLink.current?.click();
      queueMicrotask(() => { navigationBypass.current = false; });
    }
  }

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function protectUnsavedChanges(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function protectClientNavigation(event: MouseEvent) {
      if (navigationBypass.current) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDiscardDialog(link);
    }
    function protectHistoryNavigation() {
      if (navigationBypass.current) { navigationBypass.current = false; return; }
      if (restoringHistory.current) { restoringHistory.current = false; return; }
      restoringHistory.current = true;
      window.history.forward();
      openDiscardDialog(null, true);
    }
    window.addEventListener("beforeunload", protectUnsavedChanges);
    document.addEventListener("click", protectClientNavigation, true);
    window.addEventListener("popstate", protectHistoryNavigation);
    return () => {
      window.removeEventListener("beforeunload", protectUnsavedChanges);
      document.removeEventListener("click", protectClientNavigation, true);
      window.removeEventListener("popstate", protectHistoryNavigation);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (discardDialogOpen) stayButton.current?.focus();
  }, [discardDialogOpen]);

  async function handleSave() {
    if (!draft || !hasChanges) return;
    const validated = profileUpdateSchema.safeParse({ business_profile: draft });
    if (!validated.success) {
      setSaveError("Complete every profile field and add at least one target industry before saving.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile: validated.data.business_profile }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save profile");
      }

      setProfile({ ...validated.data.business_profile });
      setDraft({ ...validated.data.business_profile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function addCustomValue(field: ProfileField) {
    const value = customValues[field.id]?.trim();
    if (!value || !draft) return;
    if (field.multiSelect) {
      const current = draft[field.id] as string[];
      if (!current.some((candidate) => candidate.toLowerCase() === value.toLowerCase())) {
        setDraft({ ...draft, [field.id]: [...current, value] });
      }
    } else {
      setDraft({ ...draft, [field.id]: value });
    }
    setCustomValues((current) => ({ ...current, [field.id]: "" }));
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
      <div role="status" className="flex items-center justify-center gap-2 min-h-[400px] text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        Loading business profile…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-6">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <button type="button" onClick={() => void loadProfile()} className="mt-3 border border-red-500/30 px-3 py-2 text-sm">Retry</button>
      </div>
    );
  }

  if (!profile || !draft) return null;

  const summary = buildSummary(draft ?? profile);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Building2 className="h-4 w-4 text-cyan-500" />
            <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.25em] uppercase font-bold">[BUSINESS PROFILE]</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Business profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wide mt-1">
            Your ideal-customer context for every score, recommendation, and ICP fit calculation.
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

      {/* ICP summary sentence */}
      <div className="border border-slate-200 dark:border-foreground/[0.08] bg-slate-50 dark:bg-foreground/[0.02] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1.5">Your ICP in plain English</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">&ldquo;{summary}&rdquo;</p>
      </div>

      {/* ICP Fit explainer */}
      <IcpFitExplainer />

      {/* Profile Cards */}
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
                {[...new Set([
                  ...field.options,
                  ...(Array.isArray(draft[field.id]) ? draft[field.id] as string[] : draft[field.id] ? [draft[field.id] as string] : []),
                ])].map((option) => {
                  const selected = isSelected(field.id, option);
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() => updateField(field.id, option)}
                      aria-pressed={selected}
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
                <div className="flex min-w-full gap-2 pt-1 sm:min-w-0 sm:flex-1">
                  <label htmlFor={`custom-${field.id}`} className="sr-only">Custom {field.label}</label>
                  <input
                    id={`custom-${field.id}`}
                    aria-label={`Custom ${field.label}`}
                    value={customValues[field.id] ?? ""}
                    onChange={(event) => setCustomValues((current) => ({ ...current, [field.id]: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomValue(field);
                      }
                    }}
                    placeholder="Custom value"
                    maxLength={100}
                    className="min-w-0 flex-1 border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-cyan-500 dark:border-white/10"
                  />
                  <button type="button" aria-label={`Add custom ${field.label}`} onClick={() => addCustomValue(field)} className="border border-slate-200 px-3 py-1.5 text-xs hover:border-cyan-500 dark:border-white/10">Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {discardDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-profile-title"
            className="w-full max-w-sm border border-slate-200 bg-white p-5 shadow-xl dark:border-white/15 dark:bg-slate-950"
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.preventDefault(); closeDiscardDialog(); }
              if (event.key === "Tab") {
                if (event.shiftKey && document.activeElement === stayButton.current) { event.preventDefault(); discardButton.current?.focus(); }
                else if (!event.shiftKey && document.activeElement === discardButton.current) { event.preventDefault(); stayButton.current?.focus(); }
              }
            }}
          >
            <h2 id="discard-profile-title" className="text-base font-semibold">Discard unsaved changes?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Your business profile edits have not been saved.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button ref={stayButton} type="button" onClick={closeDiscardDialog} className="border border-slate-300 px-3 py-2 text-sm dark:border-white/15">Stay on this page</button>
              <button ref={discardButton} type="button" onClick={discardAndNavigate} className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">Discard changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
