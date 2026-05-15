/**
 * Mock signal responses for development/testing.
 * Used when MOCK_SIGNALS=true in .env.local
 * Produces realistic-looking scores without real API keys.
 */
import type { SignalSet } from "@/lib/types";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getMockSignals(domain: string): SignalSet {
  // Seed randomness on domain so same domain = same mock result
  const seed = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (min: number, max: number) => min + ((seed % (max - min + 1)));

  const fundingScore  = r(0, 25);
  const hiringScore   = r(0, 20);
  const newsScore     = r(0, 20);
  const techScore     = r(0, 20);
  const webScore      = r(0, 15);
  const githubScore   = r(0, 20);

  return {
    funding: {
      score: fundingScore,
      max: 25,
      detail: fundingScore > 15
        ? "Series B closed 42 days ago ($22M) — MOCK"
        : fundingScore > 5
        ? "Seed round 8 months ago — MOCK"
        : "No recent funding detected — MOCK",
    },
    hiring: {
      score: hiringScore,
      max: 20,
      detail: hiringScore > 12
        ? "6 open roles in Sales/RevOps/Engineering (last 30d) — MOCK"
        : hiringScore > 4
        ? "2 relevant open roles — MOCK"
        : "No relevant job postings — MOCK",
    },
    news: {
      score: newsScore,
      max: 20,
      detail: newsScore > 12
        ? "CEO replaced last month, product launch announced — MOCK"
        : newsScore > 5
        ? "Partnership announcement detected — MOCK"
        : "No significant trigger events — MOCK",
    },
    technology: {
      score: techScore,
      max: 20,
      detail: techScore > 12
        ? "Removed Salesforce, added HubSpot (CRM migration) — MOCK"
        : techScore > 5
        ? "New marketing tool detected — MOCK"
        : "No tech stack changes — MOCK",
    },
    web: {
      score: webScore,
      max: 15,
      detail: webScore > 10
        ? "Traffic up 31% MoM — MOCK"
        : webScore > 5
        ? "Traffic up 9% MoM — MOCK"
        : "Flat or declining traffic — MOCK",
    },
    github: {
      score: githubScore,
      max: 20,
      detail: githubScore > 12
        ? "8 repos pushed last 30d; 2 new repos this quarter — MOCK"
        : githubScore > 5
        ? "3 repos with recent activity — MOCK"
        : "No recent GitHub activity detected — MOCK",
    },
    latestSignalDate: new Date().toISOString(),
  };
}
