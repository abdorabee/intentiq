import type { SignalResult, ApolloPersonData } from "@/lib/types";

/**
 * Career Change Signal (max: 30, weight: 30%)
 * Scores based on job changes, promotions, and tenure from employment history.
 * Recent job changes are the strongest buying signal in person-level intent.
 */
export function computeCareerChangeSignal(person: ApolloPersonData): SignalResult {
  const MAX = 30;
  const history = person.employment_history ?? [];

  if (history.length === 0) {
    return { score: 3, max: MAX, detail: "No employment history available — limited career signal" };
  }

  const current = history.find((h) => h.current) ?? history[0];
  const now = Date.now();

  // Calculate days in current role
  let daysInRole = 999;
  if (current?.start_date) {
    daysInRole = Math.floor((now - new Date(current.start_date).getTime()) / 86_400_000);
  }

  // Check for job change (different company in history)
  const previousRoles = history.filter((h) => !h.current);
  const hasCompanyChange = previousRoles.some(
    (prev) => prev.organization_name.toLowerCase() !== current?.organization_name?.toLowerCase()
  );

  // Check for promotion (same company, different title)
  const hasPromotion = previousRoles.some(
    (prev) =>
      prev.organization_name.toLowerCase() === current?.organization_name?.toLowerCase() &&
      prev.title.toLowerCase() !== current?.title?.toLowerCase()
  );

  let score = 0;
  const details: string[] = [];

  if (hasCompanyChange && daysInRole <= 90) {
    // Job change in last 90 days — strongest signal
    score = 25;
    details.push(`Changed jobs ${daysInRole} days ago to ${current?.title ?? "new role"} at ${current?.organization_name ?? "new company"}`);
  } else if (hasPromotion && daysInRole <= 180) {
    // Promotion in last 6 months
    score = 20;
    details.push(`Promoted to ${current?.title ?? "new role"} at ${current?.organization_name ?? "company"} ${daysInRole} days ago`);
  } else if (hasCompanyChange && daysInRole <= 365) {
    // Job change in last 12 months
    score = 15;
    details.push(`Joined ${current?.organization_name ?? "company"} as ${current?.title ?? "unknown"} ${Math.round(daysInRole / 30)} months ago`);
  } else if (daysInRole > 730) {
    // Stable >2 years — low but not zero
    score = 5;
    details.push(`Stable in role as ${current?.title ?? "unknown"} for ${Math.round(daysInRole / 365)}+ years — established decision-maker`);
  } else {
    // Moderate tenure (1-2 years)
    score = 8;
    details.push(`${current?.title ?? "Unknown role"} at ${current?.organization_name ?? "company"} for ~${Math.round(daysInRole / 30)} months`);
  }

  return {
    score: Math.min(score, MAX),
    max: MAX,
    detail: details.join(". ") || `${current?.title ?? "Unknown"} at ${current?.organization_name ?? "Unknown"}`,
  };
}
