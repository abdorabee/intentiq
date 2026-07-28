import { buildHiringSignalFromJobs, type HiringJob } from "./hiring";
import { scoreNewsArticles } from "./news";
import type { SignalEvidence, SignalResult } from "@/lib/types";

const CRAWLED_EVIDENCE_SOURCE = "firecrawl";
const MIN_CRAWLED_CONFIDENCE = 0.8;

export type CrawledSignalType =
  | "funding"
  | "hiring"
  | "news"
  | "technology"
  | "web_activity";

export interface CrawledObservation {
  signal_type: CrawledSignalType;
  event_type: string;
  title: string;
  observed_at: string;
  source_url: string;
  evidence_text?: string;
  confidence: number;
  entity_match: "exact" | "uncertain" | "mismatch";
  amount_usd?: number | null;
  job_title?: string | null;
  technology_name?: string | null;
  technology_change?: "adopted" | "removed" | null;
}

const MAX_BY_SIGNAL: Record<CrawledSignalType, number> = {
  funding: 25,
  hiring: 20,
  news: 20,
  technology: 20,
  web_activity: 15,
};
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function parseObservation(value: unknown, now: Date): CrawledObservation | null {
  if (!isRecord(value)) return null;
  if (
    !["funding", "hiring", "news", "technology", "web_activity"].includes(String(value.signal_type)) ||
    typeof value.event_type !== "string" ||
    typeof value.title !== "string" ||
    typeof value.observed_at !== "string" ||
    typeof value.source_url !== "string" ||
    typeof value.confidence !== "number" ||
    value.confidence < MIN_CRAWLED_CONFIDENCE ||
    value.entity_match !== "exact"
  ) {
    return null;
  }

  const observedAt = new Date(value.observed_at);
  const sourceUrl = canonicalUrl(value.source_url);
  if (
    !Number.isFinite(observedAt.getTime()) ||
    observedAt.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS ||
    !sourceUrl ||
    !value.title.trim()
  ) {
    return null;
  }

  return {
    signal_type: value.signal_type as CrawledSignalType,
    event_type: value.event_type.trim(),
    title: value.title.trim().slice(0, 300),
    observed_at: observedAt.toISOString(),
    source_url: sourceUrl,
    evidence_text: typeof value.evidence_text === "string"
      ? value.evidence_text.trim().slice(0, 500)
      : undefined,
    confidence: Math.min(1, value.confidence),
    entity_match: "exact",
    amount_usd: typeof value.amount_usd === "number" && Number.isFinite(value.amount_usd)
      ? Math.max(0, value.amount_usd)
      : null,
    job_title: typeof value.job_title === "string" ? value.job_title.trim().slice(0, 200) : null,
    technology_name: typeof value.technology_name === "string"
      ? value.technology_name.trim().slice(0, 120)
      : null,
    technology_change: value.technology_change === "adopted" ||
      value.technology_change === "removed"
      ? value.technology_change
      : null,
  };
}

export function normalizeCrawledObservations(
  value: unknown,
  now = new Date()
): CrawledObservation[] {
  if (!Array.isArray(value)) return [];
  const deduplicated = new Map<string, CrawledObservation>();

  for (const candidate of value) {
    const observation = parseObservation(candidate, now);
    if (!observation) continue;
    const key = [
      observation.signal_type,
      canonicalText(observation.title),
      observation.observed_at.slice(0, 10),
      observation.source_url,
    ].join("|");
    const existing = deduplicated.get(key);
    if (!existing || observation.confidence > existing.confidence) {
      deduplicated.set(key, observation);
    }
  }

  return [...deduplicated.values()];
}

function signalEvidence(
  observation: CrawledObservation,
  fetchedAt: string,
  points: number
): SignalEvidence {
  return {
    label: observation.title,
    observed_at: observation.observed_at,
    source: CRAWLED_EVIDENCE_SOURCE,
    fetched_at: fetchedAt,
    source_url: observation.source_url,
    metadata: {
      event_type: observation.event_type,
      confidence: observation.confidence,
      entity_match: observation.entity_match,
      points,
      evidence_text: observation.evidence_text,
    },
  };
}

function unavailableSignal(
  signalType: CrawledSignalType,
  fetchedAt: string,
  reason: string
): SignalResult {
  return {
    score: 0,
    max: MAX_BY_SIGNAL[signalType],
    detail: `${signalType.charAt(0).toUpperCase()}${signalType.slice(1)} web evidence unavailable`,
    status: "unavailable",
    observed_at: null,
    fetched_at: fetchedAt,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: [],
    metadata: { reason, confidence: 0, entity_match: "uncertain" },
  };
}

function buildFundingSignal(
  observations: CrawledObservation[],
  fetchedAt: string,
  now: Date
): SignalResult {
  const eligible = observations
    .filter((item) => item.signal_type === "funding")
    .map((item) => ({
      item,
      ageDays: Math.max(0, (now.getTime() - new Date(item.observed_at).getTime()) / 86_400_000),
    }))
    .filter(({ ageDays }) => ageDays <= 365)
    .sort((a, b) => new Date(b.item.observed_at).getTime() - new Date(a.item.observed_at).getTime());

  if (eligible.length === 0) return unavailableSignal("funding", fetchedAt, "no_verified_dated_event");

  const newest = eligible[0];
  let score = newest.ageDays <= 90 ? 20 : 10;
  if ((newest.item.amount_usd ?? 0) >= 10_000_000 || eligible.length >= 2) score += 5;
  score = Math.min(25, score);

  return {
    score,
    max: 25,
    detail: newest.item.title,
    status: "ok",
    observed_at: newest.item.observed_at,
    fetched_at: fetchedAt,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: eligible.slice(0, 5).map(({ item }, index) =>
      signalEvidence(item, fetchedAt, index === 0 ? score : 0)
    ),
    metadata: {
      confidence: Math.max(...eligible.map(({ item }) => item.confidence)),
      entity_match: "exact",
      verified_event_count: eligible.length,
      amount_usd: newest.item.amount_usd ?? null,
    },
  };
}

function buildHiringSignal(
  observations: CrawledObservation[],
  fetchedAt: string
): SignalResult {
  const hiring = observations.filter((item) => item.signal_type === "hiring");
  const jobs: HiringJob[] = hiring.map((item) => ({
    title: item.job_title || item.title,
    posted_at: item.observed_at,
    source_url: item.source_url,
  }));
  const signal = buildHiringSignalFromJobs(jobs, fetchedAt);
  return {
    ...signal,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: (signal.evidence ?? []).map((item) => ({
      ...item,
      source: CRAWLED_EVIDENCE_SOURCE,
    })),
    metadata: {
      ...signal.metadata,
      confidence: hiring.length > 0 ? Math.max(...hiring.map((item) => item.confidence)) : 0,
      entity_match: hiring.length > 0 ? "exact" : "uncertain",
    },
  };
}

function buildNewsSignal(
  observations: CrawledObservation[],
  fetchedAt: string,
  now: Date
): SignalResult {
  const news = observations.filter((item) => item.signal_type === "news");
  const result = scoreNewsArticles(
    news.map((item) => ({
      title: item.title,
      description: item.evidence_text,
      publishedAt: item.observed_at,
      url: item.source_url,
    })),
    now,
    fetchedAt
  );

  if (result.score === 0 || !result.observedAt) {
    return unavailableSignal("news", fetchedAt, "no_verified_scoreable_event");
  }
  return {
    score: result.score,
    max: 20,
    detail: result.details.join(", "),
    status: "ok",
    observed_at: result.observedAt,
    fetched_at: fetchedAt,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: result.evidence.map((item) => ({
      ...item,
      source: CRAWLED_EVIDENCE_SOURCE,
    })),
    metadata: {
      confidence: Math.max(...news.map((item) => item.confidence)),
      entity_match: "exact",
      duplicate_events_ignored: result.duplicateCount,
      funding_events_ignored: result.fundingOnlyCount,
    },
  };
}

function buildTechnologySignal(
  observations: CrawledObservation[],
  fetchedAt: string,
  now: Date
): SignalResult {
  const eligible = observations
    .filter((item) =>
      item.signal_type === "technology" &&
      item.technology_name &&
      item.technology_change
    )
    .filter((item) =>
      now.getTime() - new Date(item.observed_at).getTime() <= 90 * 86_400_000
    );
  const deduplicated = new Map<string, CrawledObservation>();
  for (const item of eligible) {
    const key = `${canonicalText(item.technology_name ?? "")}|${item.technology_change}`;
    const existing = deduplicated.get(key);
    if (!existing || new Date(item.observed_at) > new Date(existing.observed_at)) {
      deduplicated.set(key, item);
    }
  }
  const changes = [...deduplicated.values()];
  if (changes.length === 0) {
    return unavailableSignal("technology", fetchedAt, "no_verified_dated_change");
  }

  const scored = changes.map((item) => ({
    item,
    points: item.technology_change === "adopted" ? 15 : 10,
  }));
  const score = Math.min(20, scored.reduce((sum, item) => sum + item.points, 0));
  const newest = scored.reduce((latest, current) =>
    new Date(current.item.observed_at) > new Date(latest.item.observed_at) ? current : latest
  );

  return {
    score,
    max: 20,
    detail: scored
      .map(({ item }) => `${item.technology_change === "adopted" ? "Adopted" : "Removed"}: ${item.technology_name}`)
      .join("; "),
    status: "ok",
    observed_at: newest.item.observed_at,
    fetched_at: fetchedAt,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: scored.map(({ item, points }) => signalEvidence(item, fetchedAt, points)),
    metadata: {
      confidence: Math.max(...changes.map((item) => item.confidence)),
      entity_match: "exact",
      verified_change_count: changes.length,
    },
  };
}

const WEB_CHANGE_POINTS: Record<string, number> = {
  pricing_change: 12,
  feature_launch: 10,
  integration_change: 8,
  careers_change: 5,
  publication_change: 4,
  meaningful_content_change: 3,
};

function buildWebActivitySignal(
  observations: CrawledObservation[],
  fetchedAt: string
): SignalResult {
  const changes = observations
    .filter((item) => item.signal_type === "web_activity")
    .map((item) => ({
      item,
      points: WEB_CHANGE_POINTS[item.event_type] ?? 0,
    }))
    .filter((item) => item.points > 0)
    .sort((a, b) =>
      new Date(b.item.observed_at).getTime() - new Date(a.item.observed_at).getTime()
    );

  if (changes.length === 0) {
    return unavailableSignal("web_activity", fetchedAt, "no_verified_meaningful_change");
  }

  const score = Math.min(15, changes.reduce((sum, item) => sum + item.points, 0));
  return {
    score,
    max: 15,
    detail: changes.slice(0, 3).map(({ item }) => item.title).join("; "),
    status: "ok",
    observed_at: changes[0].item.observed_at,
    fetched_at: fetchedAt,
    source: CRAWLED_EVIDENCE_SOURCE,
    evidence: changes.slice(0, 5).map(({ item, points }) =>
      signalEvidence(item, fetchedAt, points)
    ),
    metadata: {
      confidence: Math.max(...changes.map(({ item }) => item.confidence)),
      entity_match: "exact",
      meaningful_change_count: changes.length,
      change_types: [...new Set(changes.map(({ item }) => item.event_type))],
    },
  };
}

export function buildCrawledSignal(
  signalType: CrawledSignalType,
  rawObservations: unknown,
  fetchedAt: string,
  now = new Date()
): SignalResult {
  const fetchedDate = new Date(fetchedAt);
  if (!Number.isFinite(fetchedDate.getTime())) {
    return unavailableSignal(signalType, now.toISOString(), "invalid_fetched_at");
  }
  const canonicalFetchedAt = fetchedDate.toISOString();
  const observations = normalizeCrawledObservations(rawObservations, now)
    .filter((item) => item.signal_type === signalType);

  switch (signalType) {
    case "funding":
      return buildFundingSignal(observations, canonicalFetchedAt, now);
    case "hiring":
      return buildHiringSignal(observations, canonicalFetchedAt);
    case "news":
      return buildNewsSignal(observations, canonicalFetchedAt, now);
    case "technology":
      return buildTechnologySignal(observations, canonicalFetchedAt, now);
    case "web_activity":
      return buildWebActivitySignal(observations, canonicalFetchedAt);
  }
}
