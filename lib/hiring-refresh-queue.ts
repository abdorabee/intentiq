const QUEUE_NAME = "hiring-refresh";
const JOB_DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

export const HIRING_EVIDENCE_SCHEMA_VERSION = "hiring-v2";

export interface HiringRefreshJob {
  domain: string;
  schemaVersion: typeof HIRING_EVIDENCE_SCHEMA_VERSION;
  requestedAt: string;
  shadow: boolean;
}

export function hiringRefreshJobId(domain: string, nowMs = Date.now()): string {
  const canonicalDomain = domain.toLowerCase().trim();
  const freshnessBucket = Math.floor(nowMs / JOB_DEDUPE_WINDOW_MS);
  return `${HIRING_EVIDENCE_SCHEMA_VERSION}-${canonicalDomain.replace(/[^a-z0-9.-]/g, "-")}-${freshnessBucket}`;
}

export function hiringRefreshDeduplicationId(domain: string): string {
  const canonicalDomain = domain.toLowerCase().trim();
  return `${HIRING_EVIDENCE_SCHEMA_VERSION}-${canonicalDomain.replace(/[^a-z0-9.-]/g, "-")}`;
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

/**
 * Enqueue a best-effort background refresh. Missing queue infrastructure must
 * never make a user-facing score request fail.
 */
export async function enqueueHiringRefresh(domain: string): Promise<boolean> {
  const redisUrl = process.env.BULLMQ_REDIS_URL;
  if (!redisUrl) return false;

  const canonicalDomain = domain.toLowerCase().trim();
  const jobId = hiringRefreshJobId(canonicalDomain);
  const { Queue } = await import("bullmq");
  const queue = new Queue<HiringRefreshJob>(QUEUE_NAME, {
    connection: connectionFromUrl(redisUrl),
  });

  try {
    await queue.add(
      "refresh",
      {
        domain: canonicalDomain,
        schemaVersion: HIRING_EVIDENCE_SCHEMA_VERSION,
        requestedAt: new Date().toISOString(),
        shadow: process.env.SCRAPLING_SHADOW_MODE !== "false",
      },
      {
        jobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        // Stable BullMQ deduplication closes the epoch-bucket boundary race, so
        // two refreshes for one domain cannot run concurrently.
        deduplication: {
          id: hiringRefreshDeduplicationId(canonicalDomain),
          ttl: JOB_DEDUPE_WINDOW_MS,
        },
        removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
        // Active/waiting jobs retain the deterministic ID for deduplication.
        // Remove terminal failures so later score requests can retry instead
        // of being blocked by a failed ID for days.
        removeOnFail: true,
      }
    );
    return true;
  } catch (error) {
    console.warn("[hiring-refresh] enqueue failed", error);
    return false;
  } finally {
    await queue.close();
  }
}
