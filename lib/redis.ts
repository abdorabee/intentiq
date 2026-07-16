import { Redis } from "@upstash/redis";

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazy-init so missing env vars don't crash the server on startup
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!isRedisConfigured) return null;
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// Legacy person-score cache TTL. Company scoring v2 uses the explicit,
// personalized TTL below so one workspace can never receive another's result.
export const SCORE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
export const SCORE_RESULT_TTL_SECONDS = 60 * 60 * 6; // 6 hours
export const SCORE_EVIDENCE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

export function scoreCacheKey(domain: string): string {
  return `score:${domain.toLowerCase().trim()}`;
}

/** Workspace-neutral evidence cache. Never include seller/profile data here. */
export function scoreEvidenceCacheKey(domain: string, schemaVersion: string): string {
  return `score:evidence:${schemaVersion}:${domain.toLowerCase().trim()}`;
}

/** Personalized score cache, isolated by workspace, seller profile, and scorer. */
export function scoreResultCacheKey(
  userId: string,
  domain: string,
  profileHash: string,
  scoringVersion: string
): string {
  return [
    "score:result",
    scoringVersion,
    encodeURIComponent(userId),
    profileHash,
    domain.toLowerCase().trim(),
  ].join(":");
}

export function personScoreCacheKey(identifier: string): string {
  return `person_score:${identifier.toLowerCase().trim()}`;
}

export function rateLimitKey(userId: string): string {
  return `ratelimit:${userId}`;
}

/** Get from cache. Returns null if Redis is not configured or key missing. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await getRedis()?.get<T>(key) ?? null;
  } catch {
    return null;
  }
}

/** Set in cache. No-op if Redis is not configured. */
export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await getRedis()?.set(key, value, { ex: ttl });
  } catch {
    // Cache write failure is non-fatal
  }
}

// Keep named export for backward compatibility
export const redis = { get: cacheGet, set: cacheSet };
