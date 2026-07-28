import type { SignalStatus } from "./types";

const QUEUE_NAME = "web-enrichment";
const JOB_DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

export const WEB_ENRICHMENT_SCHEMA_VERSION = "web-enrichment-v1";
export const WEB_ENRICHMENT_SIGNAL_KEYS = [
  "hiring",
  "news",
  "technology",
  "web_activity",
] as const;

export const WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS = [
  "funding",
  ...WEB_ENRICHMENT_SIGNAL_KEYS,
] as const;

export type WebEnrichmentSignalKey = (typeof WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS)[number];

export interface WebEnrichmentJob {
  domain: string;
  schemaVersion: typeof WEB_ENRICHMENT_SCHEMA_VERSION;
  requestedAt: string;
  signals: WebEnrichmentSignalKey[];
  shadow: boolean;
}

export function webEnrichmentSignalsForStatuses(
  statuses: Partial<Record<WebEnrichmentSignalKey, SignalStatus>>,
  fundingFallbackEnabled: boolean
): WebEnrichmentSignalKey[] {
  const fundingUnavailable =
    statuses.funding === "unavailable" ||
    statuses.funding === "not_found" ||
    statuses.funding === "stale";
  return fundingFallbackEnabled && fundingUnavailable
    ? [...WEB_ENRICHMENT_SIGNAL_KEYS, "funding"]
    : [...WEB_ENRICHMENT_SIGNAL_KEYS];
}

export function webEnrichmentJobId(domain: string, nowMs = Date.now()): string {
  const canonicalDomain = domain.toLowerCase().trim();
  const freshnessBucket = Math.floor(nowMs / JOB_DEDUPE_WINDOW_MS);
  return `${WEB_ENRICHMENT_SCHEMA_VERSION}-${canonicalDomain.replace(/[^a-z0-9.-]/g, "-")}-${freshnessBucket}`;
}

export function webEnrichmentDeduplicationId(domain: string): string {
  const canonicalDomain = domain.toLowerCase().trim();
  return `${WEB_ENRICHMENT_SCHEMA_VERSION}-${canonicalDomain.replace(/[^a-z0-9.-]/g, "-")}`;
}

function connectionFromUrl(redisUrl: string) {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379)),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

/** Best-effort background enrichment. Missing queue infrastructure is non-fatal. */
export async function enqueueWebEnrichment(
  domain: string,
  signals: readonly WebEnrichmentSignalKey[] = WEB_ENRICHMENT_SIGNAL_KEYS
): Promise<boolean> {
  const redisUrl = process.env.BULLMQ_REDIS_URL;
  if (!redisUrl || process.env.MOCK_SIGNALS === "true") return false;

  const requestedSignals = [...new Set(signals)]
    .filter((signal): signal is WebEnrichmentSignalKey =>
      WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS.includes(signal)
    );
  if (requestedSignals.length === 0) return false;

  const canonicalDomain = domain.toLowerCase().trim();
  const { Queue } = await import("bullmq");
  const queue = new Queue<WebEnrichmentJob>(QUEUE_NAME, {
    connection: connectionFromUrl(redisUrl),
  });

  try {
    await queue.add(
      "refresh",
      {
        domain: canonicalDomain,
        schemaVersion: WEB_ENRICHMENT_SCHEMA_VERSION,
        requestedAt: new Date().toISOString(),
        signals: requestedSignals,
        shadow: process.env.WEB_ENRICHMENT_SHADOW_MODE !== "false",
      },
      {
        jobId: webEnrichmentJobId(canonicalDomain),
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        deduplication: {
          id: webEnrichmentDeduplicationId(canonicalDomain),
          ttl: JOB_DEDUPE_WINDOW_MS,
        },
        removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
        removeOnFail: true,
      }
    );
    return true;
  } catch (error) {
    console.warn("[web-enrichment] enqueue failed", error);
    return false;
  } finally {
    await queue.close();
  }
}
