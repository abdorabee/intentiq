import { z } from "zod";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const PRODUCT_TOUR_VERSION = 1;
export const ONBOARDING_LAST_STEP = 4;

export interface OnboardingDraftPreference {
  product_category: string;
  target_industries: string[];
  company_size: string;
  buyer_role: string;
  sales_motion: string;
  deal_size: string;
  sales_cycle: string;
}

export interface UserPreferences {
  theme: ThemePreference;
  product_tour_completed: boolean;
  product_tour_version: number;
  onboarding_step: number;
  onboarding_draft: OnboardingDraftPreference | null;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "dark",
  product_tour_completed: false,
  product_tour_version: PRODUCT_TOUR_VERSION,
  onboarding_step: 0,
  onboarding_draft: null,
};

export const onboardingDraftPreferenceSchema = z
  .object({
    product_category: z.string(),
    target_industries: z.array(z.string()),
    company_size: z.string(),
    buyer_role: z.string(),
    sales_motion: z.string(),
    deal_size: z.string(),
    sales_cycle: z.string(),
  })
  .passthrough();

export const userPreferencesSchema = z.object({
  theme: z.enum(THEME_PREFERENCES),
  product_tour_completed: z.boolean(),
  product_tour_version: z.number().int().positive(),
  onboarding_step: z.number().int().min(0).max(ONBOARDING_LAST_STEP),
  onboarding_draft: onboardingDraftPreferenceSchema.nullable(),
});

export const preferencesPatchSchema = z
  .object({
    theme: z.enum(THEME_PREFERENCES).optional(),
    product_tour_completed: z.boolean().optional(),
    product_tour_version: z.number().int().positive().optional(),
    onboarding_step: z.number().int().min(0).max(ONBOARDING_LAST_STEP).optional(),
    onboarding_draft: onboardingDraftPreferenceSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.theme !== undefined ||
      value.product_tour_completed !== undefined ||
      value.product_tour_version !== undefined ||
      value.onboarding_step !== undefined ||
      value.onboarding_draft !== undefined,
    { message: "At least one preference field is required" }
  );

export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>;

function cleanDraftText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeOnboardingDraft(raw: unknown): OnboardingDraftPreference | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const industries = Array.isArray(record.target_industries)
    ? record.target_industries.filter((industry): industry is string => typeof industry === "string")
    : [];

  return {
    product_category: cleanDraftText(record.product_category),
    target_industries: industries,
    company_size: cleanDraftText(record.company_size),
    buyer_role: cleanDraftText(record.buyer_role),
    sales_motion: cleanDraftText(record.sales_motion),
    deal_size: cleanDraftText(record.deal_size),
    sales_cycle: cleanDraftText(record.sales_cycle),
  };
}

export function readExplicitOnboardingStep(raw: unknown): number | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  if (!("onboarding_step" in raw)) return undefined;

  const step = (raw as Record<string, unknown>).onboarding_step;
  return typeof step === "number" && Number.isInteger(step) && step >= 0 && step <= ONBOARDING_LAST_STEP
    ? step
    : undefined;
}

export function readExplicitOnboardingDraft(raw: unknown): OnboardingDraftPreference | null | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  if (!("onboarding_draft" in raw)) return undefined;
  return normalizeOnboardingDraft((raw as Record<string, unknown>).onboarding_draft);
}

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  const record = raw as Record<string, unknown>;
  const theme = THEME_PREFERENCES.includes(record.theme as ThemePreference)
    ? (record.theme as ThemePreference)
    : DEFAULT_USER_PREFERENCES.theme;
  const productTourCompleted =
    typeof record.product_tour_completed === "boolean"
      ? record.product_tour_completed
      : DEFAULT_USER_PREFERENCES.product_tour_completed;
  const productTourVersion =
    typeof record.product_tour_version === "number" &&
    Number.isInteger(record.product_tour_version) &&
    record.product_tour_version > 0
      ? record.product_tour_version
      : DEFAULT_USER_PREFERENCES.product_tour_version;
  const onboardingStep = readExplicitOnboardingStep(raw) ?? DEFAULT_USER_PREFERENCES.onboarding_step;
  const onboardingDraft = readExplicitOnboardingDraft(raw) ?? null;

  return {
    theme,
    product_tour_completed: productTourCompleted,
    product_tour_version: productTourVersion,
    onboarding_step: onboardingStep,
    onboarding_draft: onboardingDraft,
  };
}

export function mergeUserPreferences(
  current: unknown,
  patch: PreferencesPatch
): UserPreferences {
  return {
    ...normalizeUserPreferences(current),
    ...patch,
  };
}

export function parsePreferencesPatch(body: unknown) {
  return preferencesPatchSchema.safeParse(body);
}

export function readExplicitThemePreference(raw: unknown): ThemePreference | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const theme = (raw as Record<string, unknown>).theme;
  return THEME_PREFERENCES.includes(theme as ThemePreference)
    ? (theme as ThemePreference)
    : undefined;
}

export type PreferencesResponse = {
  preferences: Omit<UserPreferences, "theme" | "onboarding_step" | "onboarding_draft"> & {
    theme?: ThemePreference;
    onboarding_step?: number;
    onboarding_draft?: OnboardingDraftPreference | null;
  };
};

export function toPreferencesResponse(raw: unknown): PreferencesResponse {
  const preferences = normalizeUserPreferences(raw);
  const storedTheme = readExplicitThemePreference(raw);
  const storedStep = readExplicitOnboardingStep(raw);
  const storedDraft = readExplicitOnboardingDraft(raw);

  const result: PreferencesResponse["preferences"] = {
    product_tour_completed: preferences.product_tour_completed,
    product_tour_version: preferences.product_tour_version,
  };
  if (storedTheme) result.theme = preferences.theme;
  if (storedStep !== undefined) result.onboarding_step = preferences.onboarding_step;
  if (storedDraft !== undefined) result.onboarding_draft = preferences.onboarding_draft;

  return { preferences: result };
}
