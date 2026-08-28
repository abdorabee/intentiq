"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import VesperWiseLogo from "@/components/vesperwise-logo";
import { extractDomain } from "@/lib/chat-client";
import {
  buildOnboardingPreferencesPatch,
  buildOnboardingProfilePut,
  BUYER_ROLE_OPTIONS,
  canSkipOnboardingStep,
  COMPANY_SIZE_OPTIONS,
  DEAL_SIZE_OPTIONS,
  getOnboardingCompleteDestination,
  INDUSTRY_OPTIONS,
  ONBOARDING_STEP_COUNT,
  onboardingReducer,
  PRODUCT_CATEGORY_OPTIONS,
  runFirstScoreAttempt,
  SALES_CYCLE_OPTIONS,
  SALES_MOTION_OPTIONS,
  createOnboardingState,
  validateOnboardingStep,
  type OnboardingFieldErrors,
  type OnboardingProfilePutPayload,
} from "@/lib/onboarding-profile";
import type { BusinessProfile } from "@/lib/types";

const STEPS = [
  { title: "Offer", description: "What you sell." },
  { title: "Accounts", description: "Industries and company size." },
  { title: "Motion", description: "Buyer and how you sell." },
  { title: "Commercial", description: "Deal size and cycle." },
  { title: "First score", description: "Score one account." },
] as const;

const HOT_PICKS = [
  { domain: "stripe.com", name: "Stripe", signal: "funding" },
  { domain: "anthropic.com", name: "Anthropic", signal: "news" },
  { domain: "linear.app", name: "Linear", signal: "hiring" },
] as const;

function includesOption(options: readonly string[], value: string) {
  return options.includes(value);
}

function avColor(name: string) {
  const colors = ["#dfff00", "#4ade80", "#e8ff40", "#f5b544", "#8a8f98"];
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="settings-error" role="alert">
      {message}
    </p>
  );
}

export default function OnboardingWizard({
  initialProfile,
  initialStep = 0,
}: {
  initialProfile: Partial<BusinessProfile> | null;
  initialStep?: number;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    onboardingReducer,
    { initialProfile, initialStep },
    ({ initialProfile: profile, initialStep: step }) => createOnboardingState(profile, step)
  );
  const [errors, setErrors] = useState<OnboardingFieldErrors>({});
  const [customProduct, setCustomProduct] = useState(
    Boolean(
      initialProfile?.product_category &&
        !includesOption(PRODUCT_CATEGORY_OPTIONS, initialProfile.product_category.trim())
    )
  );
  const [customIndustry, setCustomIndustry] = useState("");
  const [domain, setDomain] = useState("");

  const { profile, step, saveStatus, saveError } = state;
  const currentStep = STEPS[step];
  const busy = saveStatus === "saving";

  function clearError(field: keyof OnboardingFieldErrors) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateField(
    field: Exclude<keyof BusinessProfile, "target_industries">,
    value: string
  ) {
    dispatch({ type: "update_field", field, value });
    clearError(field);
  }

  function toggleIndustry(industry: string) {
    const exists = profile.target_industries.some(
      (item) => item.toLocaleLowerCase() === industry.toLocaleLowerCase()
    );
    dispatch({
      type: "set_industries",
      industries: exists
        ? profile.target_industries.filter(
            (item) => item.toLocaleLowerCase() !== industry.toLocaleLowerCase()
          )
        : [...profile.target_industries, industry],
    });
    clearError("target_industries");
  }

  function addCustomIndustry() {
    const value = customIndustry.trim();
    if (!value) return;
    if (
      !profile.target_industries.some(
        (industry) => industry.toLocaleLowerCase() === value.toLocaleLowerCase()
      )
    ) {
      dispatch({
        type: "set_industries",
        industries: [...profile.target_industries, value],
      });
    }
    setCustomIndustry("");
    clearError("target_industries");
  }

  async function persistProgress(nextStep: number): Promise<boolean> {
    dispatch({ type: "save_started" });
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOnboardingPreferencesPatch(nextStep, profile)),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? "We could not save your progress.");
      }
      dispatch({ type: "save_succeeded" });
      return true;
    } catch (error) {
      dispatch({
        type: "save_failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not save your progress. Check your connection and try again.",
      });
      return false;
    }
  }

  async function putOnboardingProfile(
    payload: OnboardingProfilePutPayload
  ): Promise<{ ok: boolean; error?: string }> {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    return { ok: response.ok, error: body?.error };
  }

  async function finishOnboardingPreferences(savedProfile: BusinessProfile) {
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildOnboardingPreferencesPatch(0, savedProfile),
        product_tour_completed: false,
      }),
    }).catch(() => undefined);
  }

  async function completeOnboarding(scoredDomain?: string | null): Promise<boolean> {
    const payload = buildOnboardingProfilePut(profile, true);
    if (!payload) {
      dispatch({
        type: "save_failed",
        message: "Add what you sell and the accounts you target before finishing.",
      });
      return false;
    }

    dispatch({ type: "save_started" });
    try {
      const saved = await putOnboardingProfile(payload);
      if (!saved.ok) {
        throw new Error(saved.error ?? "We could not save your profile.");
      }

      await finishOnboardingPreferences(payload.business_profile);

      dispatch({ type: "save_succeeded" });
      router.replace(getOnboardingCompleteDestination(scoredDomain));
      router.refresh();
      return true;
    } catch (error) {
      dispatch({
        type: "save_failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not finish setup. Check your connection and try again.",
      });
      return false;
    }
  }

  async function continueToNextStep() {
    const stepErrors = validateOnboardingStep(step, profile);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    const nextStep = Math.min(STEPS.length - 1, step + 1);
    const saved = await persistProgress(nextStep);
    if (saved) dispatch({ type: "next_step" });
  }

  async function skipCurrentStep() {
    if (!canSkipOnboardingStep(step)) return;
    setErrors({});
    if (step === STEPS.length - 1) {
      await completeOnboarding();
      return;
    }

    const nextStep = step + 1;
    const saved = await persistProgress(nextStep);
    if (saved) dispatch({ type: "skip_step" });
  }

  async function scoreFirstAccount() {
    const resolved = extractDomain(domain);
    if (!resolved) {
      setErrors({ domain: "Enter a company domain such as stripe.com." });
      return;
    }
    clearError("domain");

    dispatch({ type: "save_started" });
    const result = await runFirstScoreAttempt(resolved, profile, {
      putProfile: putOnboardingProfile,
      postScore: async (scoredDomain) => {
        const response = await fetch("/api/v1/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: scoredDomain }),
        });
        const body = await response.json().catch(() => null) as { error?: string } | null;
        return { ok: response.ok, error: body?.error };
      },
      finishPreferences: finishOnboardingPreferences,
    });

    if (result.status === "completed") {
      dispatch({ type: "save_succeeded" });
      router.replace(result.destination);
      router.refresh();
      return;
    }

    dispatch({
      type: "save_failed",
      message:
        result.error ??
        "We could not score that account. Try again or skip for now.",
    });
  }

  const customIndustries = profile.target_industries.filter(
    (industry) => !includesOption(INDUSTRY_OPTIONS, industry)
  );

  return (
    <main className="onboarding-page">
      <div className="onboarding-shell">
        <header className="onboarding-top">
          <VesperWiseLogo size={28} />
          <p className="settings-eyebrow">
            {step + 1} of {ONBOARDING_STEP_COUNT}
          </p>
        </header>

        <ol className="onboarding-steps" aria-label="Onboarding progress">
          {STEPS.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                disabled={index > step || busy}
                onClick={() => dispatch({ type: "go_to_step", step: index })}
                aria-current={index === step ? "step" : undefined}
                className={`onboarding-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
              >
                <span className="onboarding-step-index">{index + 1}</span>
                <span className="onboarding-step-label">{item.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <form
          className="onboarding-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === STEPS.length - 1) {
              void scoreFirstAccount();
              return;
            }
            void continueToNextStep();
          }}
        >
          <header className="page-head">
            <div>
              <h1 className="page-title">{currentStep.title}</h1>
              <p className="page-sub">{currentStep.description}</p>
            </div>
          </header>

          {step === 0 && (
            <fieldset
              className="settings-field"
              aria-describedby={errors.product_category ? "product-error" : undefined}
            >
              <legend className="settings-eyebrow">What does your company sell?</legend>
              <div className="settings-choice-list">
                {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={!customProduct && profile.product_category === option}
                    onClick={() => {
                      setCustomProduct(false);
                      updateField("product_category", option);
                    }}
                    className={`settings-choice${!customProduct && profile.product_category === option ? " active" : ""}`}
                  >
                    {option}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={customProduct}
                  onClick={() => {
                    if (!customProduct) updateField("product_category", "");
                    setCustomProduct(true);
                  }}
                  className={`settings-choice${customProduct ? " active" : ""}`}
                >
                  Something else
                </button>
              </div>
              {customProduct && (
                <div className="onboarding-custom">
                  <label htmlFor="custom-product" className="settings-eyebrow">
                    Describe your product or service
                  </label>
                  <input
                    id="custom-product"
                    autoFocus
                    value={profile.product_category}
                    onChange={(event) => updateField("product_category", event.target.value)}
                    placeholder="For example, revenue operations consulting"
                    className="onboarding-input"
                  />
                </div>
              )}
              <FieldError id="product-error" message={errors.product_category} />
            </fieldset>
          )}

          {step === 1 && (
            <div className="onboarding-stack">
              <fieldset
                className="settings-field"
                aria-describedby={errors.target_industries ? "industries-error" : undefined}
              >
                <legend className="settings-eyebrow">Which industries do you sell into?</legend>
                <p>Select every industry that fits.</p>
                <div className="settings-choice-list">
                  {INDUSTRY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.target_industries.includes(option)}
                      onClick={() => toggleIndustry(option)}
                      className={`settings-choice${profile.target_industries.includes(option) ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="onboarding-add-row">
                  <label htmlFor="custom-industry" className="sr-only">
                    Add another target industry
                  </label>
                  <input
                    id="custom-industry"
                    value={customIndustry}
                    onChange={(event) => setCustomIndustry(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomIndustry();
                      }
                    }}
                    placeholder="Add another industry"
                    className="onboarding-input"
                  />
                  <button type="button" onClick={addCustomIndustry} className="tb-btn outlined">
                    Add industry
                  </button>
                </div>
                {customIndustries.length > 0 && (
                  <div className="settings-choice-list" aria-label="Custom target industries">
                    {customIndustries.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => toggleIndustry(industry)}
                        className="settings-choice active"
                        aria-label={`Remove ${industry}`}
                      >
                        {industry} ×
                      </button>
                    ))}
                  </div>
                )}
                <FieldError id="industries-error" message={errors.target_industries} />
              </fieldset>

              <fieldset
                className="settings-field"
                aria-describedby={errors.company_size ? "company-size-error" : undefined}
              >
                <legend className="settings-eyebrow">What is your ideal customer size?</legend>
                <div className="settings-choice-list">
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.company_size === option}
                      onClick={() => updateField("company_size", option)}
                      className={`settings-choice${profile.company_size === option ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FieldError id="company-size-error" message={errors.company_size} />
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-stack">
              <fieldset
                className="settings-field"
                aria-describedby={errors.buyer_role ? "buyer-role-error" : undefined}
              >
                <legend className="settings-eyebrow">Who is your primary buyer?</legend>
                <div className="settings-choice-list">
                  {BUYER_ROLE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.buyer_role === option}
                      onClick={() => updateField("buyer_role", option)}
                      className={`settings-choice${profile.buyer_role === option ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FieldError id="buyer-role-error" message={errors.buyer_role} />
              </fieldset>

              <fieldset
                className="settings-field"
                aria-describedby={errors.sales_motion ? "sales-motion-error" : undefined}
              >
                <legend className="settings-eyebrow">How does your team sell?</legend>
                <div className="settings-choice-list">
                  {SALES_MOTION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.sales_motion === option}
                      onClick={() => updateField("sales_motion", option)}
                      className={`settings-choice${profile.sales_motion === option ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FieldError id="sales-motion-error" message={errors.sales_motion} />
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-stack">
              <fieldset
                className="settings-field"
                aria-describedby={errors.deal_size ? "deal-size-error" : undefined}
              >
                <legend className="settings-eyebrow">Typical deal size</legend>
                <div className="settings-choice-list">
                  {DEAL_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.deal_size === option}
                      onClick={() => updateField("deal_size", option)}
                      className={`settings-choice${profile.deal_size === option ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FieldError id="deal-size-error" message={errors.deal_size} />
              </fieldset>

              <fieldset
                className="settings-field"
                aria-describedby={errors.sales_cycle ? "sales-cycle-error" : undefined}
              >
                <legend className="settings-eyebrow">Typical sales cycle</legend>
                <div className="settings-choice-list">
                  {SALES_CYCLE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.sales_cycle === option}
                      onClick={() => updateField("sales_cycle", option)}
                      className={`settings-choice${profile.sales_cycle === option ? " active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FieldError id="sales-cycle-error" message={errors.sales_cycle} />
              </fieldset>
            </div>
          )}

          {step === 4 && (
            <section className="onboarding-score" aria-labelledby="first-score-heading">
              <p id="first-score-heading" className="sr-only">
                Score a company domain
              </p>
              <div className="prompt-holder prompt-holder--compact">
                <div className="prompt-prefix" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                    <circle cx="7" cy="7" r="5" />
                    <path d="M2 7h10M7 2c2 2 2 8 0 10M7 2c-2 2-2 8 0 10" />
                  </svg>
                </div>
                <label htmlFor="first-score-domain" className="sr-only">
                  Company domain
                </label>
                <input
                  id="first-score-domain"
                  className="prompt-input"
                  type="text"
                  placeholder="stripe.com"
                  value={domain}
                  onChange={(event) => {
                    setDomain(event.target.value);
                    clearError("domain");
                  }}
                  autoFocus
                  disabled={busy}
                  aria-describedby={errors.domain ? "domain-error" : undefined}
                />
                <button type="submit" className="prompt-go" disabled={busy}>
                  {busy ? "Scoring…" : "Score"}
                  <span className="kbd-inline">↵</span>
                </button>
              </div>
              <FieldError id="domain-error" message={errors.domain} />
              <p className="onboarding-score-meta">
                1 credit on a fresh scorable result. You can skip and score later.
              </p>
              <div className="prompt-section-label">
                <span>Try a hot pick</span>
                <span className="line" />
              </div>
              <div className="suggestion-row">
                {HOT_PICKS.map((pick) => (
                  <button
                    key={pick.domain}
                    type="button"
                    className="sugg"
                    onClick={() => {
                      setDomain(pick.domain);
                      clearError("domain");
                    }}
                  >
                    <div className="av" style={{ background: avColor(pick.name) }}>{pick.name[0]}</div>
                    {pick.domain}
                    <span className="mono-sm">▲ {pick.signal}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {saveError && (
            <div role="alert" aria-live="assertive" className="onboarding-alert">
              <p>{saveError}</p>
              {step === STEPS.length - 1 && (
                <button
                  type="button"
                  className="tb-btn outlined"
                  onClick={() => void completeOnboarding()}
                  disabled={busy}
                >
                  Continue to Score
                </button>
              )}
            </div>
          )}

          <footer className="onboarding-footer">
            <button
              type="button"
              onClick={() => dispatch({ type: "previous_step" })}
              disabled={step === 0 || busy}
              className="tb-btn outlined"
            >
              Back
            </button>
            <div className="onboarding-footer-actions">
              {canSkipOnboardingStep(step) && (
                <button
                  type="button"
                  onClick={() => void skipCurrentStep()}
                  disabled={busy}
                  className="tb-btn"
                >
                  {step === STEPS.length - 1 ? "Skip for now" : "Skip"}
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? "Saving…" : "Continue"}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
