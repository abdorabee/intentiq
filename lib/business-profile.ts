import { z } from "zod";

import type { BusinessProfile } from "@/lib/types";

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().optional();

/** Validation contract used by profile writes. Unknown fields are retained. */
export const businessProfileSchema = z.object({
  product_category: requiredText,
  target_industries: z.array(requiredText).min(1),
  company_size: requiredText,
  buyer_role: optionalText,
  sales_motion: optionalText,
  deal_size: optionalText,
  sales_cycle: optionalText,
}).passthrough();

export const profileUpdateSchema = z.object({
  business_profile: businessProfileSchema,
}).passthrough();

/**
 * Sanitize persisted legacy profiles before they influence profile hashes or
 * ICP fit. Blank industry entries are dropped for compatibility, but a profile
 * with no remaining industry is incomplete and normalizes to null.
 */
export function normalizeBusinessProfile(
  profile: BusinessProfile | null | undefined
): BusinessProfile | null {
  if (!profile || !Array.isArray(profile.target_industries)) return null;

  const seenIndustries = new Set<string>();
  const targetIndustries = profile.target_industries.flatMap((industry) => {
    if (typeof industry !== "string") return [];
    const trimmed = industry.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seenIndustries.has(key)) return [];
    seenIndustries.add(key);
    return [trimmed];
  });

  const parsed = businessProfileSchema.safeParse({
    ...profile,
    target_industries: targetIndustries,
  });

  return parsed.success ? parsed.data as BusinessProfile : null;
}
