import type { SignalResult, ApolloPersonData, BusinessProfile } from "@/lib/types";

/**
 * Seniority Fit Signal (max: 20, weight: 20%)
 * Scores how well the person's seniority matches the seller's target buyer role.
 */

const SENIORITY_LEVELS: Record<string, number> = {
  c_suite: 5,
  founder: 5,
  owner: 5,
  vp: 4,
  director: 3,
  manager: 2,
  senior: 1,
  entry: 0,
};

// Map BusinessProfile.buyer_role to a numeric seniority level
const BUYER_ROLE_MAP: Record<string, number> = {
  "C-Suite / Founders": 5,
  "VP / Director": 4,
  "Manager / Team Lead": 2,
  "Individual Contributor": 1,
};

function getSeniorityLevel(seniority: string | null): number {
  if (!seniority) return -1;
  const key = seniority.toLowerCase().replace(/[\s-]/g, "_");
  return SENIORITY_LEVELS[key] ?? -1;
}

function getSeniorityLabel(level: number): string {
  if (level >= 5) return "C-Suite/Founder";
  if (level === 4) return "VP-level";
  if (level === 3) return "Director-level";
  if (level === 2) return "Manager-level";
  if (level === 1) return "Senior IC";
  return "Entry-level";
}

export function computeSeniorityFitSignal(
  person: ApolloPersonData,
  businessProfile: BusinessProfile | null
): SignalResult {
  const MAX = 20;

  const personLevel = getSeniorityLevel(person.seniority);
  const personLabel = person.seniority
    ? getSeniorityLabel(personLevel)
    : person.title ?? "Unknown seniority";

  // If no business profile, give a moderate score based on seniority alone
  if (!businessProfile) {
    if (personLevel >= 4) {
      return { score: 15, max: MAX, detail: `${personLabel} — high seniority, likely decision-maker (no buyer profile set)` };
    }
    if (personLevel >= 2) {
      return { score: 10, max: MAX, detail: `${personLabel} — mid-level, possible influencer (no buyer profile set)` };
    }
    return { score: 3, max: MAX, detail: `${personLabel} — seniority unknown or entry-level (no buyer profile set)` };
  }

  const targetLevel = BUYER_ROLE_MAP[businessProfile.buyer_role] ?? 2;
  const targetLabel = businessProfile.buyer_role;
  const diff = Math.abs(personLevel - targetLevel);

  if (personLevel === -1) {
    return { score: 3, max: MAX, detail: `Seniority unknown — cannot match against target buyer "${targetLabel}"` };
  }

  if (diff === 0) {
    // Exact match
    return { score: 20, max: MAX, detail: `${personLabel} is an exact match for target buyer "${targetLabel}"` };
  }

  if (diff === 1 && personLevel > targetLevel) {
    // One level above target — even better, they have more authority
    return { score: 15, max: MAX, detail: `${personLabel} is one level above target buyer "${targetLabel}" — higher authority` };
  }

  if (diff === 1) {
    // One level below target — adjacent, still valuable
    return { score: 10, max: MAX, detail: `${personLabel} is close to target buyer "${targetLabel}" — likely influencer` };
  }

  if (diff === 2) {
    return { score: 6, max: MAX, detail: `${personLabel} is two levels from target buyer "${targetLabel}" — indirect influence` };
  }

  // Far from target
  return { score: 3, max: MAX, detail: `${personLabel} does not match target buyer "${targetLabel}"` };
}
