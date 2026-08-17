"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import VesperWiseLogo from "@/components/vesperwise-logo";
import {
  buildBusinessProfile,
  BUYER_ROLE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEAL_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  onboardingReducer,
  PRODUCT_CATEGORY_OPTIONS,
  SALES_CYCLE_OPTIONS,
  SALES_MOTION_OPTIONS,
  createOnboardingState,
  validateOnboardingStep,
  type OnboardingFieldErrors,
} from "@/lib/onboarding-profile";
import type { BusinessProfile } from "@/lib/types";

const STEPS = [
  { title: "Your offer", description: "Tell us what you sell." },
  { title: "Ideal accounts", description: "Define the companies you want to reach." },
  { title: "Buying motion", description: "Show us who buys and how you sell." },
  { title: "Deal profile", description: "Set your commercial context and review." },
] as const;

function includesOption(options: readonly string[], value: string) {
  return options.includes(value);
}

function ChoiceButton({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0d] ${
        selected
          ? "border-[#dfff00]/70 bg-[#dfff00]/10 text-[#f7f8f8]"
          : "border-white/10 bg-white/[0.025] text-[#b8bec8] hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span>{children}</span>
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
            selected
              ? "border-[#dfff00] bg-[#dfff00] shadow-[0_0_14px_rgba(223,255,0,0.45)]"
              : "border-white/20"
          }`}
        />
      </span>
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-red-300">
      {message}
    </p>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-white/[0.07] py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-6">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#6f747c]">
        {label}
      </dt>
      <dd className="text-sm text-[#e8eaed]">{value}</dd>
    </div>
  );
}

export default function OnboardingWizard({
  initialProfile,
}: {
  initialProfile: Partial<BusinessProfile> | null;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    onboardingReducer,
    initialProfile,
    (profile) => createOnboardingState(profile)
  );
  const [errors, setErrors] = useState<OnboardingFieldErrors>({});
  const [customProduct, setCustomProduct] = useState(
    Boolean(
      initialProfile?.product_category &&
        !includesOption(PRODUCT_CATEGORY_OPTIONS, initialProfile.product_category.trim())
    )
  );
  const [customIndustry, setCustomIndustry] = useState("");

  const { profile, step, saveStatus, saveError } = state;
  const currentStep = STEPS[step];

  function clearError(field: keyof BusinessProfile) {
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

  function continueToNextStep() {
    const stepErrors = validateOnboardingStep(step, profile);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      dispatch({ type: "next_step" });
    }
  }

  async function saveProfile() {
    const stepErrors = validateOnboardingStep(3, profile);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    const payload = buildBusinessProfile(profile);
    if (!payload) {
      dispatch({
        type: "save_failed",
        message: "Some profile details are incomplete. Review each step and try again.",
      });
      return;
    }

    dispatch({ type: "save_started" });
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile: payload }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? "We could not save your profile.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      dispatch({
        type: "save_failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not save your profile. Check your connection and try again.",
      });
    }
  }

  const customIndustries = profile.target_industries.filter(
    (industry) => !includesOption(INDUSTRY_OPTIONS, industry)
  );

  return (
    <main className="min-h-[100dvh] bg-[#08090a] text-[#f7f8f8]">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-[340px_1fr]">
        <aside className="relative overflow-hidden border-b border-white/[0.08] bg-[#0b0c0d] px-6 py-7 lg:border-b-0 lg:border-r lg:px-9 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-36 -top-40 h-80 w-80 rounded-full bg-[#dfff00]/10 blur-[120px]"
          />
          <div className="relative flex h-full flex-col">
            <VesperWiseLogo size={42} variant="wordmark" />

            <div className="mt-10 hidden lg:block">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#dfff00]">
                Profile setup
              </p>
              <h1 className="mt-4 max-w-[250px] text-3xl font-semibold leading-tight tracking-[-0.03em]">
                Make every intent score relevant to your sales motion.
              </h1>
              <p className="mt-4 max-w-[260px] text-sm leading-6 text-[#9298a1]">
                Your answers help VesperWise frame evidence and next actions around the accounts you actually sell to.
              </p>
            </div>

            <ol className="mt-7 grid grid-cols-4 gap-2 lg:mt-12 lg:grid-cols-1 lg:gap-1" aria-label="Onboarding progress">
              {STEPS.map((item, index) => (
                <li key={item.title}>
                  <button
                    type="button"
                    disabled={index > step}
                    onClick={() => dispatch({ type: "go_to_step", step: index })}
                    aria-current={index === step ? "step" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors lg:px-3 lg:py-3 ${
                      index === step
                        ? "bg-white/[0.055] text-white"
                        : index < step
                          ? "text-[#aeb4bd] hover:bg-white/[0.035]"
                          : "cursor-default text-[#50545a]"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] ${
                        index <= step
                          ? "border-[#dfff00]/45 bg-[#dfff00]/[0.08] text-[#dfff00]"
                          : "border-white/[0.08] text-[#50545a]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#62676f]">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="mt-auto hidden pt-8 font-mono text-[10px] uppercase tracking-[0.13em] text-[#555a61] lg:block">
              Seven answers · about two minutes
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8 lg:px-14 lg:py-12">
          <form
            className="w-full max-w-[760px]"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <header className="mb-8 border-b border-white/[0.08] pb-7">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a9098]">
                  {step + 1} of {STEPS.length}
                </p>
                <p className="text-xs text-[#646970]">Saved when you finish</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {currentStep.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9298a1] sm:text-base">
                {currentStep.description}
              </p>
            </header>

            {step === 0 && (
              <fieldset aria-describedby={errors.product_category ? "product-error" : undefined}>
                <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                  What does your company sell?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option}
                      selected={!customProduct && profile.product_category === option}
                      onClick={() => {
                        setCustomProduct(false);
                        updateField("product_category", option);
                      }}
                    >
                      {option}
                    </ChoiceButton>
                  ))}
                  <ChoiceButton
                    selected={customProduct}
                    onClick={() => {
                      if (!customProduct) updateField("product_category", "");
                      setCustomProduct(true);
                    }}
                  >
                    Something else
                  </ChoiceButton>
                </div>
                {customProduct && (
                  <div className="mt-4">
                    <label htmlFor="custom-product" className="mb-2 block text-sm text-[#b8bec8]">
                      Describe your product or service
                    </label>
                    <input
                      id="custom-product"
                      autoFocus
                      value={profile.product_category}
                      onChange={(event) => updateField("product_category", event.target.value)}
                      placeholder="For example, revenue operations consulting"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                    />
                  </div>
                )}
                <FieldError id="product-error" message={errors.product_category} />
              </fieldset>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <fieldset aria-describedby={errors.target_industries ? "industries-error" : undefined}>
                  <legend className="mb-2 text-sm font-medium text-[#d7dbe0]">
                    Which industries do you sell into?
                  </legend>
                  <p className="mb-4 text-xs text-[#6f747c]">Select every industry that fits.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {INDUSTRY_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={profile.target_industries.includes(option)}
                        onClick={() => toggleIndustry(option)}
                      >
                        {option}
                      </ChoiceButton>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                    />
                    <button
                      type="button"
                      onClick={addCustomIndustry}
                      className="h-11 rounded-xl border border-white/10 px-4 text-sm font-medium text-[#cbd0d6] hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
                    >
                      Add industry
                    </button>
                  </div>
                  {customIndustries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Custom target industries">
                      {customIndustries.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className="rounded-lg border border-[#dfff00]/25 bg-[#dfff00]/[0.06] px-3 py-2 text-xs text-[#dfe6a8] hover:border-red-300/40 hover:text-red-200"
                          aria-label={`Remove ${industry}`}
                        >
                          {industry} <span aria-hidden="true">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <FieldError id="industries-error" message={errors.target_industries} />
                </fieldset>

                <fieldset aria-describedby={errors.company_size ? "company-size-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                    What is your ideal customer size?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={profile.company_size === option}
                        onClick={() => updateField("company_size", option)}
                      >
                        {option}
                      </ChoiceButton>
                    ))}
                  </div>
                  <FieldError id="company-size-error" message={errors.company_size} />
                </fieldset>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <fieldset aria-describedby={errors.buyer_role ? "buyer-role-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                    Who is your primary buyer?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {BUYER_ROLE_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={profile.buyer_role === option}
                        onClick={() => updateField("buyer_role", option)}
                      >
                        {option}
                      </ChoiceButton>
                    ))}
                  </div>
                  <FieldError id="buyer-role-error" message={errors.buyer_role} />
                </fieldset>

                <fieldset aria-describedby={errors.sales_motion ? "sales-motion-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                    How does your team sell?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SALES_MOTION_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={profile.sales_motion === option}
                        onClick={() => updateField("sales_motion", option)}
                      >
                        {option}
                      </ChoiceButton>
                    ))}
                  </div>
                  <FieldError id="sales-motion-error" message={errors.sales_motion} />
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <fieldset aria-describedby={errors.deal_size ? "deal-size-error" : undefined}>
                    <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                      Typical deal size
                    </legend>
                    <div className="grid gap-3">
                      {DEAL_SIZE_OPTIONS.map((option) => (
                        <ChoiceButton
                          key={option}
                          selected={profile.deal_size === option}
                          onClick={() => updateField("deal_size", option)}
                        >
                          {option}
                        </ChoiceButton>
                      ))}
                    </div>
                    <FieldError id="deal-size-error" message={errors.deal_size} />
                  </fieldset>

                  <fieldset aria-describedby={errors.sales_cycle ? "sales-cycle-error" : undefined}>
                    <legend className="mb-4 text-sm font-medium text-[#d7dbe0]">
                      Typical sales cycle
                    </legend>
                    <div className="grid gap-3">
                      {SALES_CYCLE_OPTIONS.map((option) => (
                        <ChoiceButton
                          key={option}
                          selected={profile.sales_cycle === option}
                          onClick={() => updateField("sales_cycle", option)}
                        >
                          {option}
                        </ChoiceButton>
                      ))}
                    </div>
                    <FieldError id="sales-cycle-error" message={errors.sales_cycle} />
                  </fieldset>
                </div>

                <section aria-labelledby="profile-review" className="rounded-2xl border border-white/[0.09] bg-white/[0.025] px-5 py-3 sm:px-6">
                  <h3 id="profile-review" className="py-3 text-base font-semibold">
                    Review your profile
                  </h3>
                  <dl>
                    <ReviewRow label="Offer" value={profile.product_category || "Not selected"} />
                    <ReviewRow label="Industries" value={profile.target_industries.join(", ") || "Not selected"} />
                    <ReviewRow label="Company size" value={profile.company_size || "Not selected"} />
                    <ReviewRow label="Buyer" value={profile.buyer_role || "Not selected"} />
                    <ReviewRow label="Sales motion" value={profile.sales_motion || "Not selected"} />
                  </dl>
                </section>

                {saveError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex flex-col gap-3 rounded-xl border border-red-300/20 bg-red-400/[0.07] p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p>{saveError}</p>
                    <button
                      type="button"
                      onClick={() => void saveProfile()}
                      className="shrink-0 rounded-lg border border-red-200/25 px-3 py-2 font-medium hover:bg-red-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            <footer className="mt-9 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
              <button
                type="button"
                onClick={() => dispatch({ type: "previous_step" })}
                disabled={step === 0 || saveStatus === "saving"}
                className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-medium text-[#b8bec8] hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={continueToNextStep}
                  className="min-h-11 rounded-xl bg-[#dfff00] px-6 text-sm font-semibold text-[#090a0b] hover:bg-[#e8ff40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="min-h-11 rounded-xl bg-[#dfff00] px-6 text-sm font-semibold text-[#090a0b] hover:bg-[#e8ff40] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
                >
                  {saveStatus === "saving" ? "Saving profile..." : "Finish setup"}
                </button>
              )}
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}
