"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import VesperWiseLogo from "@/components/vesperwise-logo";
import {
  BUYER_ROLE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEAL_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  SALES_CYCLE_OPTIONS,
  SALES_MOTION_OPTIONS,
  buildBusinessProfile,
  createOnboardingState,
  onboardingReducer,
  validateOnboardingStep,
  type OnboardingFieldErrors,
} from "@/lib/onboarding-profile";
import { ONBOARDING_VERSION, onboardingProgressRequestSchema } from "@/lib/onboarding-progress";
import type { BusinessProfile } from "@/lib/types";

const STEPS = [
  { title: "Offer and target account", short: "Offer & accounts" },
  { title: "Buyer and sales motion", short: "Buyer & motion" },
  { title: "Activate your workspace", short: "First score" },
] as const;

type TextField = Exclude<keyof BusinessProfile, "target_industries">;

interface ActivationResult {
  company: string;
  domain: string;
  intent_score: number;
  score_band: "HOT" | "WARM" | "COLD";
}

interface CompletionEvidence {
  onboarding_completed: true;
  onboarding_completed_at: string;
  onboarding_completed_version: number;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-red-300">{message}</p> : null;
}

function Field({ label, value, onChange, options, error }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: readonly string[];
  error?: string;
}) {
  const listId = options ? `onboarding-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white placeholder:text-[#5f6670] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {options && <datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist>}
      <FieldError message={error} />
    </label>
  );
}

function readError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function parseProgress(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const progress = (payload as { progress?: unknown }).progress;
  if (!progress || typeof progress !== "object") return null;
  const record = progress as Record<string, unknown>;
  const parsed = onboardingProgressRequestSchema.safeParse({ step: record.step, draft: record.draft });
  if (!parsed.success || record.onboarding_version !== ONBOARDING_VERSION || typeof record.updated_at !== "string" || !record.updated_at) return null;
  return parsed.data;
}

function parseCompletion(payload: unknown): CompletionEvidence | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as { completion?: unknown }).completion;
  if (!value || typeof value !== "object") return null;
  const completion = value as Record<string, unknown>;
  if (completion.onboarding_completed !== true || typeof completion.onboarding_completed_at !== "string" || !completion.onboarding_completed_at || typeof completion.onboarding_completed_version !== "number" || completion.onboarding_completed_version < ONBOARDING_VERSION) return null;
  return completion as unknown as CompletionEvidence;
}

function parseScore(payload: unknown): ActivationResult | null {
  if (!payload || typeof payload !== "object") return null;
  const score = payload as Record<string, unknown>;
  if (typeof score.company !== "string" || typeof score.domain !== "string" || typeof score.intent_score !== "number" || !["HOT", "WARM", "COLD"].includes(String(score.score_band)) || !["complete", "partial"].includes(String(score.score_status))) return null;
  return score as unknown as ActivationResult;
}

export default function OnboardingWizard({ initialProfile, initialStep = 0, initialActivation = false }: {
  initialProfile: Partial<BusinessProfile> | null;
  initialStep?: number;
  initialActivation?: boolean;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(onboardingReducer, { profile: initialProfile, step: initialStep }, ({ profile, step }) => createOnboardingState(profile, step));
  const [errors, setErrors] = useState<OnboardingFieldErrors>({});
  const [domain, setDomain] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const [completion, setCompletion] = useState<CompletionEvidence | null>(null);
  const [scoring, setScoring] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<"idle" | "adding" | "added">("idle");
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const dirtyRevision = useRef(0);
  const domainRef = useRef<HTMLInputElement>(null);
  const { profile, step, saveStatus, saveError } = state;

  function updateField(field: TextField, value: string) {
    dirtyRevision.current += 1;
    dispatch({ type: "update_field", field, value });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateIndustries(value: string) {
    dirtyRevision.current += 1;
    dispatch({ type: "set_industries", industries: value.split(",").map((industry) => industry.trim()).filter(Boolean) });
    setErrors((current) => ({ ...current, target_industries: undefined }));
  }

  async function persistProgress(nextStep: number, draft: BusinessProfile) {
    const response = await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: nextStep, draft }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(readError(payload, "We could not save your progress."));
    const authoritative = parseProgress(payload);
    if (!authoritative) throw new Error("The saved onboarding state could not be verified.");
    return authoritative;
  }

  useEffect(() => {
    if (dirtyRevision.current === 0 || saveStatus !== "unsaved") return;
    if (!onboardingProgressRequestSchema.safeParse({ step, draft: profile }).success) return;
    const revision = dirtyRevision.current;
    let active = true;
    const timer = window.setTimeout(() => {
      dispatch({ type: "save_started" });
      void persistProgress(step, profile).then((authoritative) => {
        if (!active || dirtyRevision.current !== revision) return;
        dispatch({ type: "save_succeeded", step: authoritative.step, profile: authoritative.draft });
      }).catch((error: unknown) => {
        if (!active || dirtyRevision.current !== revision) return;
        dispatch({ type: "save_failed", message: error instanceof Error ? error.message : "We could not save your progress." });
      });
    }, 650);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // Profile and step revisions are the debounce boundary. Status transitions
    // for the same revision must not cancel an in-flight authoritative write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, step]);

  function continueFromOffer() {
    const nextErrors = validateOnboardingStep(0, profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    dirtyRevision.current += 1;
    dispatch({ type: "next_step" });
  }

  async function continueFromMotion() {
    const nextErrors = validateOnboardingStep(1, profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const completeProfile = buildBusinessProfile(profile);
    if (!completeProfile) return;
    dirtyRevision.current += 1;
    const revision = dirtyRevision.current;
    dispatch({ type: "save_started" });
    try {
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ business_profile: completeProfile }),
      });
      const profilePayload: unknown = await profileResponse.json().catch(() => null);
      if (!profileResponse.ok || !profilePayload || typeof profilePayload !== "object" || (profilePayload as { success?: unknown }).success !== true) throw new Error(readError(profilePayload, "We could not save your business profile."));
      const authoritative = await persistProgress(2, completeProfile);
      if (dirtyRevision.current !== revision) return;
      dispatch({ type: "save_succeeded", step: authoritative.step, profile: authoritative.draft });
    } catch (error) {
      dispatch({ type: "save_failed", message: error instanceof Error ? error.message : "We could not save your business profile." });
    }
  }

  function goBack() {
    dirtyRevision.current += 1;
    dispatch({ type: "previous_step" });
  }

  async function requestCompletion(reason: "activation" | "skip") {
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(readError(payload, "We could not verify onboarding completion."));
    const verified = parseCompletion(payload);
    if (!verified) throw new Error("Onboarding completion could not be verified.");
    return verified;
  }

  async function scoreAccount() {
    const requestedDomain = domain.trim();
    if (!requestedDomain) {
      setActivationError("Enter a company domain to score.");
      return;
    }
    setScoring(true);
    setActivationError(null);
    setActivationResult(null);
    try {
      const response = await fetch("/api/v1/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: requestedDomain }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(readError(payload, "Scoring failed. Try another domain."));
      const score = parseScore(payload);
      if (!score) throw new Error("Not enough current evidence to calculate a reliable score.");
      const verifiedCompletion = await requestCompletion("activation");
      setActivationResult(score);
      setCompletion(verifiedCompletion);
    } catch (error) {
      setActivationError(error instanceof Error ? error.message : "Scoring failed. Try another domain.");
    } finally {
      setScoring(false);
    }
  }

  async function skipActivation() {
    setScoring(true);
    setActivationError(null);
    try {
      await requestCompletion("skip");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setActivationError(error instanceof Error ? error.message : "We could not skip onboarding.");
    } finally {
      setScoring(false);
    }
  }

  async function confirmExistingActivation() {
    setScoring(true);
    setActivationError(null);
    try {
      setCompletion(await requestCompletion("activation"));
    } catch (error) {
      setActivationError(error instanceof Error ? error.message : "We could not verify activation.");
    } finally {
      setScoring(false);
    }
  }

  async function addToWatchlist() {
    if (!activationResult) return;
    setWatchlistStatus("adding");
    setWatchlistError(null);
    try {
      const response = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: activationResult.domain, company_name: activationResult.company }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(readError(payload, "Failed to add the account to your watchlist."));
      setWatchlistStatus("added");
    } catch (error) {
      setWatchlistStatus("idle");
      setWatchlistError(error instanceof Error ? error.message : "Failed to add the account to your watchlist.");
    }
  }

  function finish() {
    if (!completion) return;
    router.replace("/dashboard");
    router.refresh();
  }

  const statusLabel = saveStatus === "saving" ? "Saving" : saveStatus === "unsaved" ? "Unsaved" : saveStatus === "error" ? "Save error" : "Saved";

  return (
    <main className="min-h-[100dvh] bg-[#08090a] text-[#f7f8f8]">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-[330px_1fr]">
        <aside className="border-b border-white/[0.08] bg-[#0b0c0d] px-6 py-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-10">
          <VesperWiseLogo size={42} variant="wordmark" />
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-[#dfff00]">Workspace activation</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Get to a useful score, not a product tour.</h1>
          <p className="mt-4 text-sm leading-6 text-[#9298a1]">Your saved profile personalizes scoring, evidence, and next actions from the first account.</p>
          <ol className="mt-9 space-y-2" aria-label="Onboarding progress">
            {STEPS.map((item, index) => (
              <li key={item.title}>
                <button type="button" disabled={index > step || Boolean(completion)} aria-current={index === step ? "step" : undefined} onClick={() => {
                  if (index >= step) return;
                  dirtyRevision.current += 1;
                  dispatch({ type: "go_to_step", step: index });
                }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${index === step ? "bg-white/[0.06] text-white" : index < step ? "text-[#aeb4bd]" : "text-[#555b63]"}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dfff00]/30 font-mono text-xs text-[#dfff00]">{index + 1}</span>
                  <span className="text-sm font-medium">{item.short}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6d737c]">Server progress</p>
            <p className={`mt-1 text-sm ${saveStatus === "error" ? "text-red-300" : saveStatus === "saved" ? "text-[#dfff00]" : "text-white"}`}>{statusLabel}</p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-[780px]">
            <header className="mb-8 border-b border-white/[0.08] pb-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a9098]">Stage {step + 1} of 3</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{STEPS[step].title}</h2>
            </header>
            {saveError && <p role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{saveError}</p>}

            {step === 0 && <div className="space-y-6">
              <Field label="What do you sell?" value={profile.product_category} onChange={(value) => updateField("product_category", value)} error={errors.product_category} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Target industries</span>
                <input className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20" value={profile.target_industries.join(", ")} onChange={(event) => updateIndustries(event.target.value)} placeholder={INDUSTRY_OPTIONS.slice(0, 3).join(", ")} />
                <p className="mt-2 text-xs text-[#737a84]">Separate multiple industries with commas.</p>
                <FieldError message={errors.target_industries} />
              </label>
              <Field label="Ideal company size" value={profile.company_size} onChange={(value) => updateField("company_size", value)} options={COMPANY_SIZE_OPTIONS} error={errors.company_size} />
            </div>}

            {step === 1 && <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Primary buyer" value={profile.buyer_role} onChange={(value) => updateField("buyer_role", value)} options={BUYER_ROLE_OPTIONS} error={errors.buyer_role} />
              <Field label="Sales motion" value={profile.sales_motion} onChange={(value) => updateField("sales_motion", value)} options={SALES_MOTION_OPTIONS} error={errors.sales_motion} />
              <Field label="Typical deal size" value={profile.deal_size} onChange={(value) => updateField("deal_size", value)} options={DEAL_SIZE_OPTIONS} error={errors.deal_size} />
              <Field label="Typical sales cycle" value={profile.sales_cycle} onChange={(value) => updateField("sales_cycle", value)} options={SALES_CYCLE_OPTIONS} error={errors.sales_cycle} />
            </div>}

            {step === 2 && <div className="space-y-6">
              {completion ? <div className="rounded-2xl border border-[#dfff00]/30 bg-[#dfff00]/[0.07] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#dfff00]">Server-confirmed activation</p>
                <h3 className="mt-3 text-2xl font-semibold">{activationResult ? `${activationResult.company} is activated` : "Your workspace is activated"}</h3>
                {activationResult && <p className="mt-2 text-sm text-[#b8bec8]">{activationResult.domain} scored {activationResult.intent_score}/100 · {activationResult.score_band}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  {activationResult && <button type="button" onClick={() => void addToWatchlist()} disabled={watchlistStatus !== "idle"} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium">{watchlistStatus === "adding" ? "Adding…" : watchlistStatus === "added" ? "Added to watchlist" : "Add to watchlist"}</button>}
                  <button type="button" onClick={finish} className="rounded-xl bg-[#dfff00] px-5 py-3 text-sm font-semibold text-[#090a0b]">Open dashboard</button>
                </div>
              </div> : <>
                {initialActivation && <div className="rounded-xl border border-[#dfff00]/20 bg-[#dfff00]/[0.05] p-4 text-sm text-[#d9ddc5]">A persisted score or watchlist account already exists. Confirm it to activate this onboarding version.<button type="button" onClick={() => void confirmExistingActivation()} disabled={scoring} className="ml-3 underline decoration-[#dfff00] underline-offset-4">Confirm activation</button></div>}
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Company domain</span>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input ref={domainRef} value={domain} onChange={(event) => setDomain(event.target.value)} onKeyDown={(event) => {
                      if (event.key === "Enter") { event.preventDefault(); void scoreAccount(); }
                    }} placeholder="stripe.com" className="h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20" />
                    <button type="button" onClick={() => void scoreAccount()} disabled={scoring} className="h-12 rounded-xl bg-[#dfff00] px-5 text-sm font-semibold text-[#090a0b]">{scoring ? "Scoring…" : "Score account"}</button>
                  </div>
                </label>
              </>}
              {(activationError || watchlistError) && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{activationError ?? watchlistError}</p>}
              {activationError && !completion && <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void scoreAccount()} disabled={scoring} className="rounded-xl border border-white/15 px-4 py-2 text-sm">Retry</button>
                <button type="button" onClick={() => { setActivationError(null); setActivationResult(null); setDomain(""); domainRef.current?.focus(); }} className="rounded-xl border border-white/15 px-4 py-2 text-sm">Change domain</button>
                <button type="button" onClick={() => void skipActivation()} disabled={scoring} className="rounded-xl px-4 py-2 text-sm text-[#9ea5ae] underline underline-offset-4">Skip for now</button>
              </div>}
            </div>}

            {step < 2 && <footer className="mt-9 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
              <button type="button" onClick={goBack} disabled={step === 0 || saveStatus === "saving"} className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-medium text-[#b8bec8] disabled:opacity-30">Back</button>
              <button type="button" disabled={saveStatus === "saving"} onClick={() => step === 0 ? continueFromOffer() : void continueFromMotion()} className="min-h-11 rounded-xl bg-[#dfff00] px-6 text-sm font-semibold text-[#090a0b] disabled:opacity-50">{step === 1 && saveStatus === "saving" ? "Saving profile…" : "Continue"}</button>
            </footer>}
          </div>
        </section>
      </div>
    </main>
  );
}
