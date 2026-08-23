import { z } from "zod";

import {
  buildBusinessProfile,
  createOnboardingState,
  validateOnboardingStep,
} from "@/lib/onboarding-profile";

export const ONBOARDING_VERSION = 1;

const draftSchema = z.strictObject({
  product_category: z.string(),
  target_industries: z.array(z.string()),
  company_size: z.string(),
  buyer_role: z.string(),
  sales_motion: z.string(),
  deal_size: z.string(),
  sales_cycle: z.string(),
});

export const onboardingProgressRequestSchema = z
  .strictObject({
    step: z.number().int().min(0).max(2),
    draft: draftSchema,
    revision: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    const profile = createOnboardingState(value.draft).profile;
    const errors = value.step === 0
      ? {}
      : validateOnboardingStep(0, profile);
    for (const [field, message] of Object.entries(errors)) {
      context.addIssue({
        code: "custom",
        path: ["draft", field],
        message,
      });
    }
    if (value.step === 2 && !buildBusinessProfile(profile)) {
      context.addIssue({
        code: "custom",
        path: ["draft"],
        message: "Complete the business profile before continuing.",
      });
    }
  })
  .transform((value) => ({
    step: value.step,
    draft: createOnboardingState(value.draft).profile,
    revision: value.revision,
  }));

export const onboardingProgressRowSchema = z.strictObject({
  user_id: z.string().min(1),
  onboarding_step: z.number().int().min(0).max(2),
  onboarding_draft: draftSchema,
  onboarding_version: z.number().int().nonnegative(),
  onboarding_revision: z.number().int().nonnegative(),
  updated_at: z.iso.datetime({ offset: true }),
});

export type OnboardingProgress = {
  step: number;
  draft: z.infer<typeof draftSchema>;
  onboarding_version: number;
  revision: number;
  updated_at: string;
};

export function publicOnboardingProgress(
  row: z.infer<typeof onboardingProgressRowSchema>,
): OnboardingProgress {
  return {
    step: row.onboarding_step,
    draft: row.onboarding_draft,
    onboarding_version: row.onboarding_version,
    revision: row.onboarding_revision,
    updated_at: row.updated_at,
  };
}
