import { businessProfileSchema } from "./business-profile";
import type { BusinessProfile } from "./types";
import {
  ONBOARDING_LAST_STEP,
  type OnboardingDraftPreference,
} from "./user-preferences";

export const ONBOARDING_STEP_COUNT = ONBOARDING_LAST_STEP + 1;
export const FIRST_SKIPPABLE_ONBOARDING_STEP = 2;

export const PRODUCT_CATEGORY_OPTIONS = [
  "SaaS / Software",
  "Consulting / Services",
  "Hardware / Physical",
  "Marketplace / Platform",
] as const;

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "E-commerce / Retail",
  "Manufacturing",
  "Education",
] as const;

export const COMPANY_SIZE_OPTIONS = [
  "Startups (1-50)",
  "SMB (51-200)",
  "Mid-Market (201-1000)",
  "Enterprise (1000+)",
] as const;

export const BUYER_ROLE_OPTIONS = [
  "C-Suite / Founders",
  "VP / Director",
  "Manager / Team Lead",
  "Individual Contributor",
] as const;

export const SALES_MOTION_OPTIONS = [
  "Outbound (cold outreach)",
  "Inbound (content/SEO/ads)",
  "Product-Led Growth",
  "Channel / Partners",
] as const;

export const DEAL_SIZE_OPTIONS = [
  "< $5K",
  "$5K - $25K",
  "$25K - $100K",
  "$100K+",
] as const;

export const SALES_CYCLE_OPTIONS = [
  "< 2 weeks",
  "2-4 weeks",
  "1-3 months",
  "3+ months",
] as const;

export const EMPTY_BUSINESS_PROFILE: BusinessProfile = {
  product_category: "",
  target_industries: [],
  company_size: "",
  buyer_role: "",
  sales_motion: "",
  deal_size: "",
  sales_cycle: "",
};

type TextProfileField = Exclude<keyof BusinessProfile, "target_industries">;

export type OnboardingFieldErrors = Partial<Record<keyof BusinessProfile | "domain", string>>;

export interface OnboardingState {
  step: number;
  profile: BusinessProfile;
  saveStatus: "idle" | "saving" | "error";
  saveError: string | null;
}

export type OnboardingAction =
  | { type: "update_field"; field: TextProfileField; value: string }
  | { type: "set_industries"; industries: string[] }
  | { type: "next_step" }
  | { type: "previous_step" }
  | { type: "skip_step" }
  | { type: "go_to_step"; step: number }
  | { type: "save_started" }
  | { type: "save_succeeded" }
  | { type: "save_failed"; message: string };

function cleanIndustries(industries: unknown): string[] {
  if (!Array.isArray(industries)) return [];

  const seen = new Set<string>();
  return industries.flatMap((industry) => {
    if (typeof industry !== "string") return [];
    const value = industry.trim();
    const key = value.toLocaleLowerCase();
    if (!value || seen.has(key)) return [];
    seen.add(key);
    return [value];
  });
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function clampOnboardingStep(step: unknown): number {
  if (typeof step !== "number" || !Number.isInteger(step)) return 0;
  return Math.min(ONBOARDING_LAST_STEP, Math.max(0, step));
}

export function canSkipOnboardingStep(step: number): boolean {
  return step >= FIRST_SKIPPABLE_ONBOARDING_STEP && step <= ONBOARDING_LAST_STEP;
}

export function cleanBusinessProfile(
  profile: Partial<BusinessProfile> | null | undefined
): BusinessProfile {
  return {
    product_category: cleanText(profile?.product_category),
    target_industries: cleanIndustries(profile?.target_industries),
    company_size: cleanText(profile?.company_size),
    buyer_role: cleanText(profile?.buyer_role),
    sales_motion: cleanText(profile?.sales_motion),
    deal_size: cleanText(profile?.deal_size),
    sales_cycle: cleanText(profile?.sales_cycle),
  };
}

export function createOnboardingState(
  profile: Partial<BusinessProfile> | null = null,
  step = 0
): OnboardingState {
  return {
    step: clampOnboardingStep(step),
    profile: cleanBusinessProfile(profile),
    saveStatus: "idle",
    saveError: null,
  };
}

export function mergeOnboardingDraft(
  draft: Partial<BusinessProfile> | null | undefined,
  stored: Partial<BusinessProfile> | null | undefined
): BusinessProfile {
  const fromStored = cleanBusinessProfile(stored);
  const fromDraft = cleanBusinessProfile(draft);

  return {
    product_category: fromDraft.product_category || fromStored.product_category,
    target_industries:
      fromDraft.target_industries.length > 0
        ? fromDraft.target_industries
        : fromStored.target_industries,
    company_size: fromDraft.company_size || fromStored.company_size,
    buyer_role: fromDraft.buyer_role || fromStored.buyer_role,
    sales_motion: fromDraft.sales_motion || fromStored.sales_motion,
    deal_size: fromDraft.deal_size || fromStored.deal_size,
    sales_cycle: fromDraft.sales_cycle || fromStored.sales_cycle,
  };
}

export function resolveOnboardingResume(input: {
  step?: unknown;
  draft?: Partial<BusinessProfile> | OnboardingDraftPreference | null;
  profile?: Partial<BusinessProfile> | null;
}): { step: number; profile: BusinessProfile } {
  return {
    step: clampOnboardingStep(input.step),
    profile: mergeOnboardingDraft(input.draft ?? null, input.profile ?? null),
  };
}

export function buildOnboardingPreferencesPatch(
  step: number,
  profile: BusinessProfile
): { onboarding_step: number; onboarding_draft: BusinessProfile } {
  return {
    onboarding_step: clampOnboardingStep(step),
    onboarding_draft: cleanBusinessProfile(profile),
  };
}

export function buildBusinessProfile(
  profile: BusinessProfile
): BusinessProfile | null {
  const parsed = businessProfileSchema.safeParse(cleanBusinessProfile(profile));
  return parsed.success ? parsed.data as BusinessProfile : null;
}

export function validateOnboardingStep(
  step: number,
  profile: BusinessProfile
): OnboardingFieldErrors {
  const errors: OnboardingFieldErrors = {};

  if (step === 0 && !cleanText(profile.product_category)) {
    errors.product_category = "Choose what your company sells.";
  }

  if (step === 1) {
    if (cleanIndustries(profile.target_industries).length === 0) {
      errors.target_industries = "Choose at least one target industry.";
    }
    if (!cleanText(profile.company_size)) {
      errors.company_size = "Choose an ideal company size.";
    }
  }

  if (step === 2) {
    if (!cleanText(profile.buyer_role)) {
      errors.buyer_role = "Choose the primary buyer role.";
    }
    if (!cleanText(profile.sales_motion)) {
      errors.sales_motion = "Choose your sales motion.";
    }
  }

  if (step === 3) {
    if (!cleanText(profile.deal_size)) {
      errors.deal_size = "Choose a typical deal size.";
    }
    if (!cleanText(profile.sales_cycle)) {
      errors.sales_cycle = "Choose a typical sales cycle.";
    }
  }

  return errors;
}

export function getOnboardingRedirect(
  onboardingCompleted: boolean,
  destination: "dashboard" | "onboarding"
): "/dashboard" | "/onboarding" | null {
  if (destination === "dashboard" && !onboardingCompleted) {
    return "/onboarding";
  }
  if (destination === "onboarding" && onboardingCompleted) {
    return "/dashboard";
  }
  return null;
}

export function getOnboardingCompleteDestination(
  domain?: string | null
): "/score" | `/score?domain=${string}` {
  const cleaned = typeof domain === "string" ? domain.trim() : "";
  if (!cleaned) return "/score";
  return `/score?domain=${encodeURIComponent(cleaned)}`;
}

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case "update_field":
      return {
        ...state,
        profile: { ...state.profile, [action.field]: action.value },
        saveStatus: "idle",
        saveError: null,
      };
    case "set_industries":
      return {
        ...state,
        profile: { ...state.profile, target_industries: action.industries },
        saveStatus: "idle",
        saveError: null,
      };
    case "next_step":
      return { ...state, step: Math.min(ONBOARDING_LAST_STEP, state.step + 1) };
    case "skip_step":
      if (!canSkipOnboardingStep(state.step)) return state;
      return { ...state, step: Math.min(ONBOARDING_LAST_STEP, state.step + 1) };
    case "previous_step":
      return { ...state, step: Math.max(0, state.step - 1) };
    case "go_to_step":
      return {
        ...state,
        step: Math.min(ONBOARDING_LAST_STEP, Math.max(0, action.step)),
      };
    case "save_started":
      return { ...state, saveStatus: "saving", saveError: null };
    case "save_succeeded":
      return { ...state, saveStatus: "idle", saveError: null };
    case "save_failed":
      return { ...state, saveStatus: "error", saveError: action.message };
  }
}
