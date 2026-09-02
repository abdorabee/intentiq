import { z } from "zod";

import type { BusinessProfile } from "@/lib/types";

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().optional();

/**
 * Approximates the acceptance rules of lib/score-service.ts's canonicalizeDomain
 * without importing it (that module pulls in server-only Supabase/env code that
 * must not enter the client bundle this schema also validates in).
 */
const domainShape = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(253)
  .regex(/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/, "Enter a valid domain, like example.com");

/** Validation contract used by profile writes. Unknown fields are retained. */
export const businessProfileSchema = z.object({
  product_category: requiredText,
  target_industries: z.array(requiredText).min(1),
  company_size: requiredText,
  buyer_role: optionalText,
  sales_motion: optionalText,
  deal_size: optionalText,
  sales_cycle: optionalText,
  geography: z.array(requiredText).optional(),
  tech_stack_include: z.array(requiredText).optional(),
  tech_stack_exclude: z.array(requiredText).optional(),
  seed_domains: z.array(domainShape).min(1).max(5).optional(),
  workspace_name: z.string().trim().min(1).max(120).optional(),
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
