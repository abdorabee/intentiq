"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";

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

function RadioButton({
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
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`relative flex h-11 items-center gap-3 rounded-lg border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] ${
        selected
          ? "border-[#dfff00]/60 bg-[#dfff00]/[0.08] text-white"
          : "border-white/[0.08] bg-white/[0.02] text-[#b8bec8] hover:border-white/[0.15] hover:bg-white/[0.04]"
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg bg-[#dfff00]"
        />
      )}
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
          selected
            ? "border-[#dfff00] bg-[#dfff00]"
            : "border-white/[0.25]"
        }`}
      />
      <span className="font-medium">{children}</span>
    </button>
  );
}

function CheckboxButton({
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
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={`relative flex h-11 items-center gap-3 rounded-lg border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] ${
        selected
          ? "border-[#dfff00]/60 bg-[#dfff00]/[0.08] text-white"
          : "border-white/[0.08] bg-white/[0.02] text-[#b8bec8] hover:border-white/[0.15] hover:bg-white/[0.04]"
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg bg-[#dfff00]"
        />
      )}
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected
            ? "border-[#dfff00] bg-[#dfff00]"
            : "border-white/[0.25]"
        }`}
      >
        {selected && (
          <svg className="h-2.5 w-2.5 text-black" fill="none" viewBox="0 0 10 8">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 4l2.5 2.5L9 1"
            />
          </svg>
        )}
      </span>
      <span className="font-medium">{children}</span>
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
    <div className="flex justify-between border-b border-white/[0.06] py-3.5 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-[0.1em] text-[#6f747c]">
        {label}
      </dt>
      <dd className="text-sm text-[#d4d8dc]">{value}</dd>
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

  function skipStep() {
    dispatch({ type: "next_step" });
  }

  async function saveProfile() {
    const stepErrors = validateOnboardingStep(1, profile);
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

      router.replace("/score");
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
      <div className="mx-auto flex min-h-[100dvh] max-w-[600px] flex-col px-5 py-8">
        <header className="mb-10">
          <h1 className="text-lg font-semibold tracking-tight">
            VESPERWISE<span className="text-[#dfff00]">.</span>
          </h1>
          <div className="mt-3 flex items-start justify-between text-xs">
            <p className="text-[#7a7f87]">
              {step + 1} OF {STEPS.length}
            </p>
            <p className="text-[#5a5f67]">Saved when you finish</p>
          </div>
        </header>

        <form
          className="flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-medium text-white">
              {currentStep.title}
            </h2>
            <p className="mt-1.5 text-sm text-[#9298a1]">
              {currentStep.description}
            </p>
          </div>

            {step === 0 && (
              <fieldset aria-describedby={errors.product_category ? "product-error" : undefined}>
                <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                  What does your company sell?
                </legend>
                <div className="grid gap-2.5">
                  {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                    <RadioButton
                      key={option}
                      selected={!customProduct && profile.product_category === option}
                      onClick={() => {
                        setCustomProduct(false);
                        updateField("product_category", option);
                      }}
                    >
                      {option}
                    </RadioButton>
                  ))}
                  <RadioButton
                    selected={customProduct}
                    onClick={() => {
                      if (!customProduct) updateField("product_category", "");
                      setCustomProduct(true);
                    }}
                  >
                    Something else
                  </RadioButton>
                </div>
                {customProduct && (
                  <div className="mt-4">
                    <label htmlFor="custom-product" className="sr-only">
                      Describe your product or service
                    </label>
                    <input
                      id="custom-product"
                      autoFocus
                      value={profile.product_category}
                      onChange={(event) => updateField("product_category", event.target.value)}
                      placeholder="Describe your product or service"
                      className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                    />
                  </div>
                )}
                <FieldError id="product-error" message={errors.product_category} />
              </fieldset>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <fieldset aria-describedby={errors.target_industries ? "industries-error" : undefined}>
                  <legend className="mb-2 text-sm font-medium text-[#c5c9cf]">
                    Which industries do you sell into?
                  </legend>
                  <p className="mb-4 text-xs text-[#6f747c]">Select every industry that fits.</p>
                  <div className="grid gap-2.5">
                    {INDUSTRY_OPTIONS.map((option) => (
                      <CheckboxButton
                        key={option}
                        selected={profile.target_industries.includes(option)}
                        onClick={() => toggleIndustry(option)}
                      >
                        {option}
                      </CheckboxButton>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
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
                      className="h-11 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                    />
                    <button
                      type="button"
                      onClick={addCustomIndustry}
                      className="btn-pill flex h-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-sm font-medium text-[#b8bec8] hover:border-white/[0.15] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
                    >
                      Add industry
                    </button>
                  </div>
                  <FieldError id="industries-error" message={errors.target_industries} />
                </fieldset>

                <fieldset aria-describedby={errors.company_size ? "company-size-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                    What is your ideal customer size?
                  </legend>
                  <div className="grid gap-2.5">
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <RadioButton
                        key={option}
                        selected={profile.company_size === option}
                        onClick={() => updateField("company_size", option)}
                      >
                        {option}
                      </RadioButton>
                    ))}
                  </div>
                  <FieldError id="company-size-error" message={errors.company_size} />
                </fieldset>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <fieldset aria-describedby={errors.buyer_role ? "buyer-role-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                    Who is your primary buyer?
                  </legend>
                  <div className="grid gap-2.5">
                    {BUYER_ROLE_OPTIONS.map((option) => (
                      <RadioButton
                        key={option}
                        selected={profile.buyer_role === option}
                        onClick={() => updateField("buyer_role", option)}
                      >
                        {option}
                      </RadioButton>
                    ))}
                  </div>
                  <FieldError id="buyer-role-error" message={errors.buyer_role} />
                </fieldset>

                <fieldset aria-describedby={errors.sales_motion ? "sales-motion-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                    How does your team sell?
                  </legend>
                  <div className="grid gap-2.5">
                    {SALES_MOTION_OPTIONS.map((option) => (
                      <RadioButton
                        key={option}
                        selected={profile.sales_motion === option}
                        onClick={() => updateField("sales_motion", option)}
                      >
                        {option}
                      </RadioButton>
                    ))}
                  </div>
                  <FieldError id="sales-motion-error" message={errors.sales_motion} />
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <fieldset aria-describedby={errors.deal_size ? "deal-size-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                    Typical deal size
                  </legend>
                  <div className="grid gap-2.5">
                    {DEAL_SIZE_OPTIONS.map((option) => (
                      <RadioButton
                        key={option}
                        selected={profile.deal_size === option}
                        onClick={() => updateField("deal_size", option)}
                      >
                        {option}
                      </RadioButton>
                    ))}
                  </div>
                  <FieldError id="deal-size-error" message={errors.deal_size} />
                </fieldset>

                <fieldset aria-describedby={errors.sales_cycle ? "sales-cycle-error" : undefined}>
                  <legend className="mb-4 text-sm font-medium text-[#c5c9cf]">
                    Typical sales cycle
                  </legend>
                  <div className="grid gap-2.5">
                    {SALES_CYCLE_OPTIONS.map((option) => (
                      <RadioButton
                        key={option}
                        selected={profile.sales_cycle === option}
                        onClick={() => updateField("sales_cycle", option)}
                      >
                        {option}
                      </RadioButton>
                    ))}
                  </div>
                  <FieldError id="sales-cycle-error" message={errors.sales_cycle} />
                </fieldset>

                <section aria-labelledby="profile-review" className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-2">
                  <h3 id="profile-review" className="py-3 text-base font-medium">
                    Review your profile
                  </h3>
                  <dl>
                    <ReviewRow label="Offer" value={profile.product_category || "Not selected"} />
                    <ReviewRow label="Industries" value={profile.target_industries.join(", ") || "Not selected"} />
                    <ReviewRow label="Company size" value={profile.company_size || "Not selected"} />
                    <ReviewRow label="Buyer" value={profile.buyer_role || "Not selected"} />
                    <ReviewRow label="Sales motion" value={profile.sales_motion || "Not selected"} />
                    <ReviewRow label="Deal size" value={profile.deal_size || "Not selected"} />
                    <ReviewRow label="Sales cycle" value={profile.sales_cycle || "Not selected"} />
                  </dl>
                </section>

                {saveError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex flex-col gap-3 rounded-lg border border-red-300/20 bg-red-400/[0.07] p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
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

          <footer className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "previous_step" })}
              disabled={step === 0 || saveStatus === "saving"}
              className="btn-pill flex h-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 text-sm font-medium text-[#b8bec8] hover:border-white/[0.15] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
            >
              Back
            </button>

            <div className="flex gap-3">
              {(step === 2 || step === 3) && (
                <button
                  type="button"
                  onClick={step === 3 ? () => void saveProfile() : skipStep}
                  disabled={saveStatus === "saving"}
                  className="btn-pill flex h-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 text-sm font-medium text-[#b8bec8] hover:border-white/[0.15] hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
                >
                  Skip
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={continueToNextStep}
                  className="btn-pill flex h-11 items-center justify-center rounded-lg bg-[#dfff00] px-6 text-sm font-semibold text-[#090a0b] hover:bg-[#e8ff40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="btn-pill flex h-11 items-center justify-center rounded-lg bg-[#dfff00] px-6 text-sm font-semibold text-[#090a0b] hover:bg-[#e8ff40] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
                >
                  {saveStatus === "saving" ? "Saving..." : "Finish setup"}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
