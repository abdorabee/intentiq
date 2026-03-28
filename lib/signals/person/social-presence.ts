import type { SignalResult, ApolloPersonData, BusinessProfile } from "@/lib/types";

/**
 * Social Presence Signal (max: 15, weight: 15%)
 * Scores the completeness and relevance of enrichment data.
 * More data points = more accessible and engageable prospect.
 */

// Map department keywords to BusinessProfile buyer_role keywords
const DEPARTMENT_ROLE_MAP: Record<string, string[]> = {
  "C-Suite / Founders": ["executive", "c_suite", "founder", "owner", "ceo", "cto", "cfo", "coo"],
  "VP / Director": ["sales", "marketing", "engineering", "operations", "product", "revenue", "growth"],
  "Manager / Team Lead": ["sales", "marketing", "engineering", "operations", "product", "support"],
  "Individual Contributor": ["sales", "marketing", "engineering", "design", "support", "customer_success"],
};

export function computeSocialPresenceSignal(
  person: ApolloPersonData,
  businessProfile: BusinessProfile | null
): SignalResult {
  const MAX = 15;
  let score = 0;
  const details: string[] = [];

  // Has LinkedIn URL (+3)
  if (person.linkedin_url) {
    score += 3;
    details.push("LinkedIn profile found");
  }

  // Has email (+3)
  if (person.email) {
    score += 3;
    details.push("email available");
  }

  // Has phone (+3)
  if (person.phone) {
    score += 3;
    details.push("phone available");
  }

  // Seniority >= VP (+3)
  const highSeniority = ["c_suite", "vp", "founder", "owner"];
  if (person.seniority && highSeniority.includes(person.seniority.toLowerCase().replace(/[\s-]/g, "_"))) {
    score += 3;
    details.push(`senior role (${person.seniority})`);
  }

  // Department matches buyer role (+3)
  if (businessProfile?.buyer_role && person.department) {
    const relevantDepts = DEPARTMENT_ROLE_MAP[businessProfile.buyer_role] ?? [];
    const dept = person.department.toLowerCase().replace(/[\s-]/g, "_");
    if (relevantDepts.some((d) => dept.includes(d))) {
      score += 3;
      details.push(`department (${person.department}) aligns with target buyer`);
    }
  }

  return {
    score: Math.min(score, MAX),
    max: MAX,
    detail: details.length > 0
      ? details.join(", ")
      : "Limited social/contact data available",
  };
}
