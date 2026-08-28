"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  animate,
  createScope,
  createTimeline,
  splitText,
  spring,
  stagger,
  svg,
  utils,
  type Scope,
  type TextSplitter,
} from "animejs";

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

import CalibrationPanel from "./calibration-panel";
import { deriveCalibrationState } from "./calibration-state";

const STEPS = [
  {
    title: "Your offer",
    description: "Tell us what you sell. This installs the core module.",
  },
  {
    title: "Ideal accounts",
    description: "Define the companies you want to reach.",
  },
  {
    title: "Buying motion",
    description: "Show us who buys and how you sell.",
  },
  {
    title: "Deal profile",
    description: "Set your commercial context and review the calibration.",
  },
] as const;

const STAGE_LABELS = ["offer", "accounts", "motion", "deal"] as const;

function includesOption(options: readonly string[], value: string) {
  return options.includes(value);
}

function ChoiceButton({
  selected,
  index,
  children,
  onClick,
}: {
  selected: boolean;
  index?: number;
  children: React.ReactNode;
  onClick: (element: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-choice
      onClick={(event) => onClick(event.currentTarget)}
      className={`group flex min-h-12 items-center gap-3 border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a] ${
        selected
          ? "border-[#dfff00]/70 bg-[#dfff00]/[0.05] text-[#f7f8f8]"
          : "border-white/[0.11] bg-transparent text-[#b8bec8] hover:border-white/25 hover:text-white"
      }`}
    >
      {typeof index === "number" && (
        <span
          aria-hidden="true"
          className={`font-mono text-[10px] tracking-[0.1em] ${
            selected ? "text-[#dfff00]" : "text-[#4c5057] group-hover:text-[#6f747c]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
      <span
        aria-hidden="true"
        data-choice-indicator
        className={`h-2 w-2 shrink-0 ${
          selected ? "bg-[#dfff00]" : "border border-white/25"
        }`}
      />
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-3 font-mono text-[12px] tracking-[0.02em] text-red-300">
      {message}
    </p>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-review-module
      className="grid gap-1 border-b border-white/[0.07] py-3 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-6"
    >
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6f747c]">
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
  const calibration = useMemo(
    () => deriveCalibrationState(step, profile),
    [step, profile]
  );

  const rootRef = useRef<HTMLElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const initialStepRef = useRef(step);

  // Component-scoped animation. Everything here is decoration: the wizard is
  // fully driven by React state, and reverting the scope restores plain markup.
  useEffect(() => {
    if (!rootRef.current) return;

    const scope = createScope({
      root: rootRef.current,
      mediaQueries: {
        reduceMotion: "(prefers-reduced-motion: reduce)",
        isCompact: "(max-width: 1023px)",
      },
    }).add((self) => {
      if (!self) return;
      const reduce = Boolean(self.matches.reduceMotion);
      let splitter: TextSplitter | null = null;
      let lastStage = initialStepRef.current;

      // Assembly timeline: one labeled segment per calibration stage, easing
      // that stage's diagnostic readouts into their seated position.
      const readoutGroups = [[0], [1, 2], [3, 4], [5, 6]];
      const rows = utils.$("[data-readout-row]");
      const assembly = createTimeline({
        autoplay: false,
        defaults: { duration: 420, ease: "outCubic" },
      });
      STAGE_LABELS.forEach((label, stage) => {
        assembly.label(label);
        const group = readoutGroups[stage]
          .map((i) => rows[i])
          .filter(Boolean);
        if (group.length > 0) {
          assembly.add(group, {
            opacity: [0.3, 1],
            x: [-10, 0],
            delay: stagger(90),
          });
        }
      });

      // Time at which stage N's readouts are fully seated: the start of the
      // next label, or the timeline end for the final stage.
      const seekToStage = (stage: number) => {
        if (stage >= STAGE_LABELS.length - 1) return assembly.duration;
        return assembly.labels[STAGE_LABELS[stage + 1]] ?? assembly.duration;
      };

      // Rows behind the current stage start seated; the rest start dimmed.
      if (!reduce && rows.length > 0) {
        assembly.seek(seekToStage(lastStage));
      }

      self.add("goToStage", (stage: number) => {
        const from = assembly.currentTime;
        const to = seekToStage(stage);
        lastStage = stage;
        if (reduce || to <= from) {
          assembly.seek(to);
          return;
        }
        const proxy = { t: from };
        animate(proxy, {
          t: to,
          duration: Math.min(900, Math.max(350, to - from)),
          ease: "inOutQuad",
          onUpdate: () => assembly.seek(proxy.t),
        });
      });

      self.add("headingIn", () => {
        const heading = utils.$("[data-step-heading]")[0];
        if (!heading) return;
        if (splitter) {
          try {
            splitter.revert();
          } catch {
            // Heading node was replaced by React; nothing to revert.
          }
          splitter = null;
        }
        if (reduce) return;
        splitter = splitText(heading, {
          words: { wrap: "clip" },
          accessible: true,
        });
        animate(splitter.words, {
          y: ["0.9em", "0em"],
          opacity: [0, 1],
          duration: 520,
          delay: stagger(34),
          ease: "outCubic",
        });
      });

      self.add("stepIn", () => {
        if (reduce) return;
        const items = utils.$("[data-step-panel] [data-animate-item]");
        if (items.length === 0) return;
        animate(items, {
          opacity: [0, 1],
          y: [14, 0],
          duration: 440,
          delay: stagger(26),
          ease: "outCubic",
        });
      });

      self.add("confirm", (element: HTMLElement) => {
        if (reduce) return;
        const indicator = element.querySelector("[data-choice-indicator]");
        if (!indicator) return;
        animate(indicator, {
          scale: [0.3, 1],
          duration: 600,
          ease: spring({ stiffness: 320, damping: 16 }),
        });
      });

      self.add("drawSignal", (name: string) => {
        if (reduce) return;
        const targets = utils.$(`.vw-signal-path[data-signal="${name}"]`);
        if (targets.length === 0) return;
        const [drawable] = svg.createDrawable(targets[0]);
        if (!drawable) return;
        animate(drawable, {
          draw: ["0 0", "0 1"],
          duration: 620,
          ease: "inOutQuad",
        });
      });

      self.add("lockDial", () => {
        if (reduce) return;
        const modules = utils.$("[data-review-module]");
        if (modules.length === 0) return;
        animate(modules, {
          opacity: [0.55, 1],
          duration: 500,
          ease: "outQuad",
        });
      });
    });

    scopeRef.current = scope;
    return () => {
      scope.revert();
      scopeRef.current = null;
    };
  }, []);

  // Step transitions decorate after React has already switched the content.
  useEffect(() => {
    const methods = scopeRef.current?.methods;
    methods?.goToStage?.(step);
    methods?.headingIn?.();
    methods?.stepIn?.();
  }, [step]);

  function callScope(name: string, ...args: unknown[]) {
    scopeRef.current?.methods?.[name]?.(...args);
  }

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
    <main
      ref={rootRef}
      className="min-h-[100dvh] overflow-x-clip bg-[#08090a] text-[#f7f8f8]"
    >
      <div className="mx-auto grid min-h-[100dvh] max-w-[1600px] lg:grid-cols-[45fr_55fr]">
        <CalibrationPanel
          step={step}
          profile={profile}
          calibration={calibration}
          onStepSelect={(target) => dispatch({ type: "go_to_step", step: target })}
        />

        <section className="flex min-w-0 items-start justify-center px-5 py-10 sm:px-8 lg:items-center lg:px-14 lg:py-12">
          <form
            className="w-full max-w-[720px]"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <header className="mb-9 border-b border-white/[0.08] pb-7">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a9098]">
                  Stage {String(step + 1).padStart(2, "0")}{" "}
                  <span className="text-[#4c5057]">/ 04</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4c5057]">
                  Saved when you finish
                </p>
              </div>
              <h2
                key={step}
                data-step-heading
                className="mt-5 text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[44px]"
              >
                {currentStep.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#9298a1] sm:text-base">
                {currentStep.description}
              </p>
            </header>

            <div data-step-panel key={`panel-${step}`}>
              {step === 0 && (
                <fieldset aria-describedby={errors.product_category ? "product-error" : undefined}>
                  <legend
                    data-animate-item
                    className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                  >
                    What does your company sell?
                  </legend>
                  <div className="grid gap-px sm:grid-cols-2 sm:gap-3">
                    {PRODUCT_CATEGORY_OPTIONS.map((option, index) => (
                      <div data-animate-item key={option}>
                        <ChoiceButton
                          index={index}
                          selected={!customProduct && profile.product_category === option}
                          onClick={(element) => {
                            setCustomProduct(false);
                            updateField("product_category", option);
                            callScope("confirm", element);
                          }}
                        >
                          {option}
                        </ChoiceButton>
                      </div>
                    ))}
                    <div data-animate-item>
                      <ChoiceButton
                        index={PRODUCT_CATEGORY_OPTIONS.length}
                        selected={customProduct}
                        onClick={(element) => {
                          if (!customProduct) updateField("product_category", "");
                          setCustomProduct(true);
                          callScope("confirm", element);
                        }}
                      >
                        Something else
                      </ChoiceButton>
                    </div>
                  </div>
                  {customProduct && (
                    <div className="mt-5">
                      <label
                        htmlFor="custom-product"
                        className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-[#b8bec8]"
                      >
                        Describe your product or service
                      </label>
                      <input
                        id="custom-product"
                        autoFocus
                        value={profile.product_category}
                        onChange={(event) => updateField("product_category", event.target.value)}
                        placeholder="For example, revenue operations consulting"
                        className="h-12 w-full border border-white/[0.11] bg-white/[0.02] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                      />
                    </div>
                  )}
                  <FieldError id="product-error" message={errors.product_category} />
                </fieldset>
              )}

              {step === 1 && (
                <div className="space-y-10">
                  <fieldset aria-describedby={errors.target_industries ? "industries-error" : undefined}>
                    <legend
                      data-animate-item
                      className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                    >
                      Which industries do you sell into?
                    </legend>
                    <p data-animate-item className="mb-4 text-xs text-[#6f747c]">
                      Select every industry that fits.
                    </p>
                    <div className="grid gap-px sm:grid-cols-2 sm:gap-3">
                      {INDUSTRY_OPTIONS.map((option, index) => (
                        <div data-animate-item key={option}>
                          <ChoiceButton
                            index={index}
                            selected={profile.target_industries.includes(option)}
                            onClick={(element) => {
                              toggleIndustry(option);
                              callScope("confirm", element);
                            }}
                          >
                            {option}
                          </ChoiceButton>
                        </div>
                      ))}
                    </div>
                    <div data-animate-item className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                        className="h-11 flex-1 border border-white/[0.11] bg-white/[0.02] px-4 text-sm text-white placeholder:text-[#555b63] focus:border-[#dfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#dfff00]/20"
                      />
                      <button
                        type="button"
                        onClick={addCustomIndustry}
                        className="h-11 border border-white/[0.11] px-4 text-sm font-medium text-[#cbd0d6] hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
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
                            className="border border-[#dfff00]/25 bg-[#dfff00]/[0.05] px-3 py-2 font-mono text-[11px] text-[#dfe6a8] hover:border-red-300/40 hover:text-red-200"
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
                    <legend
                      data-animate-item
                      className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                    >
                      What is your ideal customer size?
                    </legend>
                    <div className="grid gap-px sm:grid-cols-2 sm:gap-3">
                      {COMPANY_SIZE_OPTIONS.map((option, index) => (
                        <div data-animate-item key={option}>
                          <ChoiceButton
                            index={index}
                            selected={profile.company_size === option}
                            onClick={(element) => {
                              updateField("company_size", option);
                              callScope("confirm", element);
                            }}
                          >
                            {option}
                          </ChoiceButton>
                        </div>
                      ))}
                    </div>
                    <FieldError id="company-size-error" message={errors.company_size} />
                  </fieldset>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10">
                  <fieldset aria-describedby={errors.buyer_role ? "buyer-role-error" : undefined}>
                    <legend
                      data-animate-item
                      className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                    >
                      Who is your primary buyer?
                    </legend>
                    <div className="grid gap-px sm:grid-cols-2 sm:gap-3">
                      {BUYER_ROLE_OPTIONS.map((option, index) => (
                        <div data-animate-item key={option}>
                          <ChoiceButton
                            index={index}
                            selected={profile.buyer_role === option}
                            onClick={(element) => {
                              updateField("buyer_role", option);
                              callScope("confirm", element);
                              callScope("drawSignal", "buyer");
                            }}
                          >
                            {option}
                          </ChoiceButton>
                        </div>
                      ))}
                    </div>
                    <FieldError id="buyer-role-error" message={errors.buyer_role} />
                  </fieldset>

                  <fieldset aria-describedby={errors.sales_motion ? "sales-motion-error" : undefined}>
                    <legend
                      data-animate-item
                      className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                    >
                      How does your team sell?
                    </legend>
                    <div className="grid gap-px sm:grid-cols-2 sm:gap-3">
                      {SALES_MOTION_OPTIONS.map((option, index) => (
                        <div data-animate-item key={option}>
                          <ChoiceButton
                            index={index}
                            selected={profile.sales_motion === option}
                            onClick={(element) => {
                              updateField("sales_motion", option);
                              callScope("confirm", element);
                              callScope("drawSignal", "motion");
                            }}
                          >
                            {option}
                          </ChoiceButton>
                        </div>
                      ))}
                    </div>
                    <FieldError id="sales-motion-error" message={errors.sales_motion} />
                  </fieldset>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10">
                  <div className="grid gap-10 md:grid-cols-2 md:gap-8">
                    <fieldset aria-describedby={errors.deal_size ? "deal-size-error" : undefined}>
                      <legend
                        data-animate-item
                        className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                      >
                        Typical deal size
                      </legend>
                      <div className="grid gap-px sm:gap-3">
                        {DEAL_SIZE_OPTIONS.map((option, index) => (
                          <div data-animate-item key={option}>
                            <ChoiceButton
                              index={index}
                              selected={profile.deal_size === option}
                              onClick={(element) => {
                                updateField("deal_size", option);
                                callScope("confirm", element);
                                callScope("lockDial");
                              }}
                            >
                              {option}
                            </ChoiceButton>
                          </div>
                        ))}
                      </div>
                      <FieldError id="deal-size-error" message={errors.deal_size} />
                    </fieldset>

                    <fieldset aria-describedby={errors.sales_cycle ? "sales-cycle-error" : undefined}>
                      <legend
                        data-animate-item
                        className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#d7dbe0]"
                      >
                        Typical sales cycle
                      </legend>
                      <div className="grid gap-px sm:gap-3">
                        {SALES_CYCLE_OPTIONS.map((option, index) => (
                          <div data-animate-item key={option}>
                            <ChoiceButton
                              index={index}
                              selected={profile.sales_cycle === option}
                              onClick={(element) => {
                                updateField("sales_cycle", option);
                                callScope("confirm", element);
                                callScope("lockDial");
                              }}
                            >
                              {option}
                            </ChoiceButton>
                          </div>
                        ))}
                      </div>
                      <FieldError id="sales-cycle-error" message={errors.sales_cycle} />
                    </fieldset>
                  </div>

                  <section
                    aria-labelledby="profile-review"
                    data-animate-item
                    className="vw-schematic-frame relative border border-white/[0.09] px-5 py-3 sm:px-6"
                  >
                    <h3
                      id="profile-review"
                      className="py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#d7dbe0]"
                    >
                      Calibration review
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
                      className="flex flex-col gap-3 border border-red-300/25 bg-red-400/[0.06] p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p>{saveError}</p>
                      <button
                        type="button"
                        onClick={() => void saveProfile()}
                        className="shrink-0 border border-red-200/25 px-3 py-2 font-medium hover:bg-red-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="mt-10 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
              <button
                type="button"
                onClick={() => dispatch({ type: "previous_step" })}
                disabled={step === 0 || saveStatus === "saving"}
                className="min-h-11 border border-white/[0.11] px-5 text-sm font-medium text-[#b8bec8] hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00]"
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={continueToNextStep}
                  className="min-h-11 bg-[#dfff00] px-7 text-sm font-semibold tracking-[0.01em] text-[#090a0b] hover:bg-[#e8ff40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="min-h-11 bg-[#dfff00] px-7 text-sm font-semibold tracking-[0.01em] text-[#090a0b] hover:bg-[#e8ff40] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
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
