import { z } from "zod";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const PRODUCT_TOUR_VERSION = 1;

export interface UserPreferences {
  theme: ThemePreference;
  product_tour_completed: boolean;
  product_tour_version: number;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "dark",
  product_tour_completed: false,
  product_tour_version: PRODUCT_TOUR_VERSION,
};

export const userPreferencesSchema = z.object({
  theme: z.enum(THEME_PREFERENCES),
  product_tour_completed: z.boolean(),
  product_tour_version: z.number().int().positive(),
});

export const preferencesPatchSchema = z
  .object({
    theme: z.enum(THEME_PREFERENCES).optional(),
    product_tour_completed: z.boolean().optional(),
    product_tour_version: z.number().int().positive().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.theme !== undefined ||
      value.product_tour_completed !== undefined ||
      value.product_tour_version !== undefined,
    { message: "At least one preference field is required" }
  );

export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>;

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

  return {
    theme,
    product_tour_completed: productTourCompleted,
    product_tour_version: productTourVersion,
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
