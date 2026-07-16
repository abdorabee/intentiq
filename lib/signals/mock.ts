/** Deterministic development signals with the same metadata contract as live sources. */
import type { SignalResult, SignalSet } from "@/lib/types";

const SOURCE = "mock";

function isoDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function mockSignal(
  score: number,
  max: number,
  detail: string,
  now: Date,
  ageDays: number | null,
  source: string,
  contextOnly = false
): SignalResult {
  const observedAt = score > 0 && ageDays !== null ? isoDaysAgo(now, ageDays) : null;
  const effectiveScore = observedAt ? score : 0;
  const fetchedAt = now.toISOString();
  return {
    score: effectiveScore,
    max,
    detail,
    status: observedAt ? "ok" : "no_signal",
    observed_at: observedAt,
    fetched_at: fetchedAt,
    source,
    evidence: observedAt
      ? [{
          label: detail,
          observed_at: observedAt,
          source,
          fetched_at: fetchedAt,
          metadata: { mock: true },
        }]
      : [],
    metadata: { mock: true, context_only: contextOnly },
  };
}

export function getMockSignals(domain: string): SignalSet {
  const now = new Date();
  const seed = domain.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  const ranged = (min: number, max: number, salt: number) =>
    min + ((seed * salt) % (max - min + 1));

  const fundingScore = ranged(0, 25, 3);
  const hiringScore = ranged(0, 20, 5);
  const newsScore = ranged(0, 20, 7);
  const techScore = ranged(0, 20, 11);
  const webScore = ranged(0, 15, 13);
  const githubScore = ranged(0, 20, 17);

  return {
    funding: mockSignal(
      fundingScore,
      25,
      fundingScore > 15
        ? "Series B closed 42 days ago ($22M) — MOCK"
        : fundingScore > 5
          ? "Seed round 8 months ago — MOCK"
          : "No recent funding detected — MOCK",
      now,
      fundingScore > 15 ? 42 : fundingScore > 5 ? 240 : null,
      SOURCE
    ),
    hiring: mockSignal(
      hiringScore,
      20,
      hiringScore > 12
        ? "6 open roles in Sales/RevOps/Engineering (last 30d) — MOCK"
        : hiringScore > 4
          ? "2 relevant open roles — MOCK"
          : "No relevant job postings — MOCK",
      now,
      hiringScore > 0 ? 10 : null,
      SOURCE
    ),
    news: mockSignal(
      newsScore,
      20,
      newsScore > 12
        ? "CEO replaced last month, product launch announced — MOCK"
        : newsScore > 5
          ? "Partnership announcement detected — MOCK"
          : "No significant trigger events — MOCK",
      now,
      newsScore > 0 ? 15 : null,
      SOURCE
    ),
    technology: mockSignal(
      techScore,
      20,
      techScore > 12
        ? "Removed Salesforce, added HubSpot (CRM migration) — MOCK"
        : techScore > 5
          ? "New marketing tool detected — MOCK"
          : "No tech stack changes — MOCK",
      now,
      techScore > 0 ? 30 : null,
      SOURCE
    ),
    web: mockSignal(
      webScore,
      15,
      webScore > 10
        ? "Growing mid-market web presence — MOCK"
        : webScore > 5
          ? "Established web presence — MOCK"
          : "Limited web presence — MOCK",
      now,
      webScore > 0 ? 0 : null,
      SOURCE,
      true
    ),
    github: mockSignal(
      githubScore,
      20,
      githubScore > 12
        ? "8 repos pushed last 30d; 2 new repos this quarter — MOCK"
        : githubScore > 5
          ? "3 repos with recent activity — MOCK"
          : "No recent GitHub activity detected — MOCK",
      now,
      githubScore > 0 ? 10 : null,
      SOURCE,
      true
    ),
    latestSignalDate: now.toISOString(),
  };
}
