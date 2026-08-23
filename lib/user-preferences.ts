import { z } from "zod";

export const themePreferenceSchema = z.enum(["system", "light", "dark"]);
export const tourStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "dismissed",
]);

const preferenceFields = {
  theme: themePreferenceSchema,
  sidebar_collapsed: z.boolean(),
  analytics_enabled: z.boolean(),
  onboarding_version: z.number().int().nonnegative(),
  onboarding_step: z.number().int().nonnegative(),
  onboarding_draft: z.record(z.string(), z.unknown()),
  tour_version: z.number().int().nonnegative(),
  tour_status: tourStatusSchema,
  tour_step: z.number().int().nonnegative(),
  tour_updated_at: z.iso.datetime({ offset: true }).nullable(),
} as const;

export const userPreferencesPatchSchema = z
  .strictObject({
    theme: preferenceFields.theme.optional(),
    sidebar_collapsed: preferenceFields.sidebar_collapsed.optional(),
    analytics_enabled: preferenceFields.analytics_enabled.optional(),
    onboarding_version: preferenceFields.onboarding_version.optional(),
    onboarding_step: preferenceFields.onboarding_step.optional(),
    onboarding_draft: preferenceFields.onboarding_draft.optional(),
    tour_version: preferenceFields.tour_version.optional(),
    tour_status: preferenceFields.tour_status.optional(),
    tour_step: preferenceFields.tour_step.optional(),
    tour_updated_at: preferenceFields.tour_updated_at.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference is required",
  });

export const userPreferencesRowSchema = z.strictObject({
  user_id: z.string().min(1),
  ...preferenceFields,
  updated_at: z.iso.datetime({ offset: true }),
});

export const userPreferencesSchema = userPreferencesRowSchema.omit({ user_id: true });

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type TourStatus = z.infer<typeof tourStatusSchema>;
export type UserPreferencesPatch = z.infer<typeof userPreferencesPatchSchema>;
export type UserPreferencesRow = z.infer<typeof userPreferencesRowSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const THEME_STORAGE_KEY = "intentiq-theme";
export const SIDEBAR_STORAGE_KEY = "nav-collapsed";

export function publicUserPreferences(row: UserPreferencesRow): UserPreferences {
  const preferences: Partial<UserPreferencesRow> = { ...row };
  delete preferences.user_id;
  return userPreferencesSchema.parse(preferences);
}

export async function patchUserPreferences(
  patch: UserPreferencesPatch,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const validated = userPreferencesPatchSchema.parse(patch);
  const response = await fetcher("/api/user/preferences", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validated),
  });

  if (!response.ok) throw new Error("Failed to save preferences");
}

export interface PreferenceWriteCoordinator<T> {
  request: (value: T) => void;
  reconcile: (value: T) => void;
}

export function createPreferenceWriteCoordinator<T>({
  initialValue,
  persist,
  rollback,
}: {
  initialValue: T;
  persist: (value: T) => Promise<void>;
  rollback: (value: T) => void;
}): PreferenceWriteCoordinator<T> {
  let confirmed = initialValue;
  let desired = initialValue;
  let revision = 0;
  let writing = false;

  async function drain() {
    if (writing || Object.is(desired, confirmed)) return;

    writing = true;
    const attempted = desired;
    const attemptedRevision = revision;
    try {
      await persist(attempted);
      confirmed = attempted;
    } catch {
      if (revision === attemptedRevision) {
        desired = confirmed;
        rollback(confirmed);
      }
    } finally {
      writing = false;
      if (!Object.is(desired, confirmed)) void drain();
    }
  }

  return {
    request(value) {
      desired = value;
      revision += 1;
      void drain();
    },
    reconcile(value) {
      confirmed = value;
      desired = value;
      revision += 1;
    },
  };
}
