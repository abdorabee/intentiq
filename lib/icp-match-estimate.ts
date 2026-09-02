import type { BusinessProfile } from "./types";

const BASE_UNIVERSE = 40_000;

const SIZE_NARROWING: Record<string, number> = {
  "Startups (1-50)": 0.5,
  "SMB (51-200)": 0.32,
  "Mid-Market (201-1000)": 0.16,
  "Enterprise (1000+)": 0.05,
};

/**
 * An illustrative, client-side-only estimate of how many companies plausibly
 * match a set of ICP filters. This is NOT a real query against any company
 * database — no account-discovery data source exists in this product. It
 * exists purely to give screen 2 a sense of scale as filters narrow; the
 * screen labels it explicitly as an estimate, never as a live count.
 */
export function estimateIcpMatches(
  profile: Pick<BusinessProfile, "target_industries" | "company_size" | "geography">
): number {
  let n = BASE_UNIVERSE;

  const industryCount = profile.target_industries?.length ?? 0;
  if (industryCount > 0) {
    n *= Math.min(1, 0.55 / industryCount + 0.08);
  }

  n *= profile.company_size && SIZE_NARROWING[profile.company_size] !== undefined
    ? SIZE_NARROWING[profile.company_size]
    : 0.35;

  const geoCount = profile.geography?.length ?? 0;
  if (geoCount > 0) {
    n *= Math.min(1, 0.5 + geoCount * 0.12);
  }

  return Math.max(40, Math.round(n / 10) * 10);
}
