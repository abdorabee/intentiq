import {
  buildHiringSignalFromJobs,
  type HiringJob,
} from "./signals/hiring";
import {
  buildCrawledSignal,
  type CrawledSignalType,
} from "./signals/crawled";
import { HIRING_EVIDENCE_SCHEMA_VERSION } from "./hiring-refresh-queue";
import {
  WEB_ENRICHMENT_SCHEMA_VERSION,
  WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS,
} from "./web-enrichment-queue";
import type {
  SignalEvidence,
  SignalResult,
  SignalStatus,
} from "./types";

const EVIDENCE_FRESHNESS_MS = 6 * 60 * 60 * 1000;

export interface SignalEvidenceRow {
  canonical_domain: string;
  signal_type: string;
  source: string;
  schema_version: string;
  status: SignalStatus;
  observed_at: string | null;
  fetched_at: string;
  expires_at: string | null;
  evidence: unknown;
  raw_payload: unknown;
  shadow: boolean;
}

function isUsableStatus(status: SignalStatus): boolean {
  return status === "ok" || status === "no_signal" || status === "stale";
}

function isFresh(row: SignalEvidenceRow, nowMs: number): boolean {
  const fetchedAt = new Date(row.fetched_at).getTime();
  return Number.isFinite(fetchedAt) && Math.max(0, nowMs - fetchedAt) <= EVIDENCE_FRESHNESS_MS;
}

/**
 * Collapse evidence upserts by their database identity. A transient failed
 * refresh never replaces an unexpired last-known-good row for the same source.
 */
export function prepareEvidenceForPersistence(
  rows: readonly SignalEvidenceRow[],
  now = new Date()
): SignalEvidenceRow[] {
  const groups = new Map<string, SignalEvidenceRow[]>();
  for (const row of rows) {
    const identity = [
      row.canonical_domain,
      row.signal_type,
      row.source,
      row.schema_version,
    ].join("|");
    groups.set(identity, [...(groups.get(identity) ?? []), row]);
  }

  return Array.from(groups.values()).map((group) => {
    const newestFirst = [...group].sort(
      (a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
    );
    const newest = newestFirst[0];
    const retainedGood = newestFirst.find((row) => {
      if (!isUsableStatus(row.status) || !row.expires_at) return false;
      const expiresAt = new Date(row.expires_at).getTime();
      return Number.isFinite(expiresAt) && expiresAt > now.getTime();
    });

    return !isUsableStatus(newest.status) && retainedGood ? retainedGood : newest;
  });
}

export type HiringEvidencePriority = "primary" | "scrapling" | null;

/**
 * Fresh Explorium hiring evidence always wins. After a failed primary refresh,
 * a fresh promoted Scrapling observation outranks stale Explorium LKG; when both
 * fallbacks are stale, the primary LKG remains authoritative.
 */
export function chooseHiringEvidencePriority(
  primaryRow: SignalEvidenceRow | null,
  scraplingRow: SignalEvidenceRow | null,
  now = new Date()
): HiringEvidencePriority {
  const usablePrimary = primaryRow && !primaryRow.shadow && isUsableStatus(primaryRow.status)
    ? primaryRow
    : null;
  const usableScrapling = scraplingRow && !scraplingRow.shadow && isUsableStatus(scraplingRow.status)
    ? scraplingRow
    : null;
  const nowMs = now.getTime();

  if (usablePrimary && usablePrimary.status !== "stale" && isFresh(usablePrimary, nowMs)) {
    return "primary";
  }
  if (usableScrapling && usableScrapling.status !== "stale" && isFresh(usableScrapling, nowMs)) {
    return "scrapling";
  }
  if (usablePrimary) return "primary";
  if (usableScrapling) return "scrapling";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSignalResult(value: unknown): value is SignalResult {
  return isRecord(value) &&
    typeof value.score === "number" &&
    Number.isFinite(value.score) &&
    typeof value.max === "number" &&
    Number.isFinite(value.max) &&
    value.max > 0 &&
    typeof value.detail === "string";
}

export function signalFromEvidenceRow(row: SignalEvidenceRow): SignalResult | null {
  if (isSignalResult(row.raw_payload)) {
    const evidence = Array.isArray(row.evidence)
      ? row.evidence as SignalEvidence[]
      : row.raw_payload.evidence ?? [];
    return {
      ...row.raw_payload,
      status: row.status,
      observed_at: row.observed_at,
      fetched_at: row.fetched_at,
      evidence,
    };
  }

  if (
    row.signal_type === "hiring" &&
    row.source === "scrapling" &&
    row.schema_version === HIRING_EVIDENCE_SCHEMA_VERSION &&
    isRecord(row.raw_payload)
  ) {
    const rawEvidence = isRecord(row.raw_payload.evidence)
      ? row.raw_payload.evidence
      : isRecord(row.evidence) ? row.evidence : null;
    const rawJobs = rawEvidence && Array.isArray(rawEvidence.jobs) ? rawEvidence.jobs : [];
    const jobs: HiringJob[] = rawJobs.flatMap((job) => {
      if (!isRecord(job) || typeof job.title !== "string" || !job.title.trim()) return [];
      return [{
        title: job.title,
        department: typeof job.department === "string" ? job.department : null,
        requisition_id: typeof job.requisition_id === "string" ? job.requisition_id : null,
        location: typeof job.location === "string" ? job.location : null,
        posted_at: typeof job.posted_at === "string" ? job.posted_at : null,
        source_url: typeof job.source_url === "string" ? job.source_url : null,
      }];
    });
    const normalized = buildHiringSignalFromJobs(jobs, row.fetched_at);
    const status = row.status === "stale"
      ? "stale"
      : row.status === "ok" ? normalized.status : row.status;
    return {
      ...normalized,
      status,
      observed_at: normalized.observed_at ?? row.observed_at,
      fetched_at: row.fetched_at,
      metadata: {
        ...normalized.metadata,
        source: "scrapling",
        entity_match: rawEvidence?.entity_match,
      },
    };
  }

  if (
    WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS.includes(row.signal_type as CrawledSignalType) &&
    row.source === "firecrawl" &&
    row.schema_version === WEB_ENRICHMENT_SCHEMA_VERSION &&
    isRecord(row.raw_payload)
  ) {
    const signalType = row.signal_type as CrawledSignalType;
    const normalized = buildCrawledSignal(
      signalType,
      row.raw_payload.observations,
      row.fetched_at
    );
    const status = row.status === "stale"
      ? "stale"
      : row.status === "ok" ? normalized.status : row.status;
    return {
      ...normalized,
      status,
      observed_at: normalized.observed_at ?? row.observed_at,
      fetched_at: row.fetched_at,
      metadata: {
        ...normalized.metadata,
        selected_source: "firecrawl",
      },
    };
  }

  return null;
}

function alternativeConfidence(row: SignalEvidenceRow): number {
  if (!["firecrawl", "scrapling", "scrapling-web"].includes(row.source)) return 1;

  const raw = isRecord(row.raw_payload) ? row.raw_payload : null;
  const metadata = raw && isRecord(raw.metadata) ? raw.metadata : null;
  if (metadata && typeof metadata.confidence === "number") {
    return metadata.entity_match === "exact"
      ? Math.max(0, Math.min(1, metadata.confidence))
      : 0;
  }

  const observations = raw && Array.isArray(raw.observations) ? raw.observations : [];
  const exactConfidences = observations.flatMap((observation) =>
    isRecord(observation) &&
    observation.entity_match === "exact" &&
    typeof observation.confidence === "number"
      ? [Math.max(0, Math.min(1, observation.confidence))]
      : []
  );
  if (exactConfidences.length > 0) return Math.max(...exactConfidences);

  const evidence = raw && isRecord(raw.evidence)
    ? raw.evidence
    : isRecord(row.evidence) ? row.evidence : null;
  return evidence?.entity_match === "exact" ? 1 : 0;
}

function timestamp(value: string | null | undefined): number {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Choose one promoted source for a trigger. Fresh verified positives outrank
 * fresh no-signal rows; recency and confidence break ties. Sources are never
 * combined, preventing provider/crawler double counting.
 */
export function chooseBestSignalEvidence(
  rows: readonly SignalEvidenceRow[],
  now = new Date(),
  minimumAlternativeConfidence = 0.8
): SignalEvidenceRow | null {
  const nowMs = now.getTime();
  const candidates = rows.filter((row) => {
    if (row.shadow || !isUsableStatus(row.status)) return false;
    const confidence = alternativeConfidence(row);
    return !["firecrawl", "scrapling", "scrapling-web"].includes(row.source) ||
      confidence >= minimumAlternativeConfidence;
  });

  candidates.sort((a, b) => {
    const freshDelta = Number(isFresh(b, nowMs) && b.status !== "stale") -
      Number(isFresh(a, nowMs) && a.status !== "stale");
    if (freshDelta !== 0) return freshDelta;

    const positiveDelta = Number(b.status === "ok") - Number(a.status === "ok");
    if (positiveDelta !== 0) return positiveDelta;

    const observedDelta = timestamp(b.observed_at) - timestamp(a.observed_at);
    if (observedDelta !== 0) return observedDelta;

    const confidenceDelta = alternativeConfidence(b) - alternativeConfidence(a);
    if (confidenceDelta !== 0) return confidenceDelta;

    return timestamp(b.fetched_at) - timestamp(a.fetched_at);
  });

  return candidates[0] ?? null;
}
