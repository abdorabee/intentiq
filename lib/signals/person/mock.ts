import type { PersonSignalSet } from "@/lib/types";

/**
 * Mock person signals for development (MOCK_SIGNALS=true).
 * Deterministic — seeded by identifier string.
 */
export function getMockPersonSignals(identifier: string): PersonSignalSet {
  const seed = identifier.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (min: number, max: number) => min + (seed % (max - min + 1));

  const hasRecentChange = seed % 2 === 0;

  return {
    career_change: {
      score: hasRecentChange ? r(18, 25) : r(5, 12),
      max: 30,
      detail: hasRecentChange
        ? `Changed jobs ${r(15, 75)} days ago — strong buying window signal — MOCK`
        : `Stable in current role for ${r(12, 36)} months — established but no urgency trigger — MOCK`,
    },
    seniority_fit: {
      score: r(10, 20),
      max: 20,
      detail: seed % 3 === 0
        ? "VP-level — exact match for target buyer persona — MOCK"
        : seed % 3 === 1
        ? "Director-level — close to target buyer, likely influencer — MOCK"
        : "Manager-level — two levels from target, indirect influence — MOCK",
    },
    company_intent: {
      score: r(7, 20),
      max: 20,
      detail: seed % 3 === 0
        ? "Company scored 82/100 (HOT) — actively showing buying signals — MOCK"
        : seed % 3 === 1
        ? "Company scored 61/100 (WARM) — meaningful intent signals detected — MOCK"
        : "Company scored 38/100 (COLD) — limited company-level signals — MOCK",
    },
    news_mentions: {
      score: r(0, 12),
      max: 15,
      detail: seed % 4 === 0
        ? "Mentioned in recent funding announcement and leadership article — MOCK"
        : seed % 4 === 1
        ? 'leadership: "Named VP of Sales at TechFlow" — MOCK'
        : seed % 4 === 2
        ? "No strong news triggers found — MOCK"
        : 'growth: "Company expands into EMEA under new leadership" — MOCK',
    },
    social_presence: {
      score: r(6, 15),
      max: 15,
      detail: "LinkedIn profile found, email available, phone available — MOCK",
    },
    latestSignalDate: new Date().toISOString(),
  };
}
