import type {
  IntentScore,
  IntentSignalKey,
  ScoreBand,
  ScoreStatus,
  SignalContribution,
  SignalResult,
  SignalSet,
  SignalStatus,
} from "@/lib/types";
import { addDays } from "date-fns";

export const SCORING_VERSION = "v2-linear-2026-07";
export const LEGACY_SCORING_VERSION = "v1-saturated-rollback";

/** Only time-bound purchase-intent triggers contribute to the composite score. */
export const TRIGGER_WEIGHTS: Record<IntentSignalKey, number> = {
  funding: 22,
  hiring: 19,
  news: 18,
  technology: 18,
};

const TRIGGER_KEYS = Object.keys(TRIGGER_WEIGHTS) as IntentSignalKey[];
const TOTAL_TRIGGER_WEIGHT = Object.values(TRIGGER_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
const PARTIAL_COVERAGE_THRESHOLD = 0.6;
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

const STATUS_COVERAGE_FACTOR: Record<SignalStatus, number> = {
  ok: 1,
  no_signal: 1,
  stale: 0.5,
  not_found: 0,
  unavailable: 0,
};

export type ScoredSignal = SignalContribution;

export type ScoreComputation = Omit<
  IntentScore,
  | "ai_summary"
  | "recommended_action"
  | "buying_stage"
  | "urgency"
  | "key_triggers"
  | "why_now"
  | "email_subject"
  | "talk_track"
  | "model_tier"
  | "cached"
  | "charged"
  | "icp_fit_score"
  | "model_fallback"
  | "automation_eligible"
  | "is_baseline"
  | "profile_hash"
  | "source_status"
  | "score_id"
  | "score_run_id"
>;

interface ScoringBreakdown {
  contributions: ScoredSignal[];
  dataCoverage: number;
  scoreStatus: ScoreStatus;
  rawScore: number | null;
  finalScore: number | null;
}

interface SignalBase {
  output: Omit<ScoredSignal, "contribution">;
  rawValue: number;
  decayedValue: number;
}

function getScoreBand(score: number): ScoreBand {
  if (score >= 75) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function parseValidDate(
  value: string | null | undefined,
  now: Date
): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  if (date.getTime() > now.getTime() + MAX_FUTURE_CLOCK_SKEW_MS) return null;
  return date;
}

function daysBetween(now: Date, observedAt: Date): number {
  return Math.max(0, (now.getTime() - observedAt.getTime()) / 86_400_000);
}

/** A signal retains 85% of its value for each 30 days since its observed event. */
export function computeFreshness(ageDays: number): number {
  if (!Number.isFinite(ageDays)) return 0;
  return Math.pow(0.85, Math.max(0, ageDays) / 30);
}

function inferLegacyStatus(signal: SignalResult): SignalStatus {
  return Number.isFinite(signal.score) && signal.score > 0 ? "ok" : "no_signal";
}

function buildSignalBase(
  type: IntentSignalKey,
  signal: SignalResult,
  legacyLatestSignalDate: string,
  now: Date
): SignalBase {
  const isLegacy = signal.status === undefined;
  let status = signal.status ?? inferLegacyStatus(signal);
  const validNumbers =
    Number.isFinite(signal.score) &&
    Number.isFinite(signal.max) &&
    signal.max > 0;

  if (!validNumbers) status = "unavailable";

  const canCarryScore = status === "ok" || status === "stale";
  const rawScore = canCarryScore && validNumbers
    ? 100 * clamp(signal.score / signal.max, 0, 1)
    : 0;

  // New v2 adapters must provide an event timestamp for positive evidence.
  // The set-level date is accepted only for legacy cached/mock payloads.
  const observedDate =
    parseValidDate(signal.observed_at, now) ??
    (isLegacy ? parseValidDate(legacyLatestSignalDate, now) : null);

  if (rawScore > 0 && !observedDate) status = "unavailable";

  const effectiveRawScore = status === "ok" || status === "stale" ? rawScore : 0;
  const ageDays = effectiveRawScore > 0 && observedDate
    ? daysBetween(now, observedDate)
    : null;
  const freshness = status === "no_signal"
    ? 1
    : effectiveRawScore > 0 && ageDays !== null
      ? computeFreshness(ageDays)
      : 0;
  const baseWeight = TRIGGER_WEIGHTS[type];
  const effectiveWeight = baseWeight * STATUS_COVERAGE_FACTOR[status];

  const decayedValue = effectiveRawScore * freshness;

  return {
    output: {
      type,
      status,
      rawScore: round(effectiveRawScore, 4),
      decayedScore: round(decayedValue, 4),
      freshness: round(freshness, 6),
      daysAgo: ageDays === null ? null : round(ageDays, 2),
      summary: signal.detail,
      baseWeight,
      effectiveWeight,
      observedAt: observedDate?.toISOString() ?? null,
    },
    rawValue: effectiveRawScore,
    decayedValue,
  };
}

function scoreSignals(signals: SignalSet, now: Date): ScoringBreakdown {
  const bases = TRIGGER_KEYS.map((key) =>
    buildSignalBase(key, signals[key], signals.latestSignalDate, now)
  );

  const effectiveWeightTotal = bases.reduce(
    (sum, signal) => sum + signal.output.effectiveWeight,
    0
  );
  const coverage = effectiveWeightTotal / TOTAL_TRIGGER_WEIGHT;
  const scoreStatus: ScoreStatus = coverage === 1
    ? "complete"
    : coverage >= PARTIAL_COVERAGE_THRESHOLD
      ? "partial"
      : "unscorable";

  const contributions: ScoredSignal[] = bases.map((signal) => ({
    ...signal.output,
    contribution: effectiveWeightTotal > 0
      ? round((signal.output.effectiveWeight * signal.decayedValue) / effectiveWeightTotal, 4)
      : 0,
  }));

  if (scoreStatus === "unscorable" || effectiveWeightTotal === 0) {
    return {
      contributions,
      dataCoverage: round(coverage, 4),
      scoreStatus,
      rawScore: null,
      finalScore: null,
    };
  }

  const rawScore = bases.reduce(
    (sum, signal) => sum + signal.output.effectiveWeight * signal.rawValue,
    0
  ) / effectiveWeightTotal;
  const finalScore = bases.reduce(
    (sum, signal) => sum + signal.output.effectiveWeight * signal.decayedValue,
    0
  ) / effectiveWeightTotal;

  return {
    contributions,
    dataCoverage: round(coverage, 4),
    scoreStatus,
    rawScore: clamp(Math.round(rawScore), 0, 100),
    finalScore: clamp(Math.round(finalScore), 0, 100),
  };
}

export function computeIntentScore(
  company: string,
  domain: string,
  signals: SignalSet,
  now = new Date()
): ScoreComputation {
  const breakdown = scoreSignals(signals, now);

  return {
    company,
    domain,
    intent_score: breakdown.finalScore,
    score_band: breakdown.finalScore === null ? null : getScoreBand(breakdown.finalScore),
    last_updated: now.toISOString(),
    signals,
    score_decay_date: addDays(now, 30).toISOString(),
    scoring_version: SCORING_VERSION,
    score_status: breakdown.scoreStatus,
    data_coverage: breakdown.dataCoverage,
    contributions: breakdown.contributions,
    raw_score: breakdown.rawScore,
    // Kept for older dashboard clients; coverage is now the explicit contract.
    confidence: breakdown.dataCoverage,
  };
}

// Emergency rollback engine retained intentionally. It keeps the prior
// saturation behavior while honoring the public four-trigger contract, so Web
// and GitHub remain context-only in every scoring version.
const LEGACY_WEIGHTS: Record<IntentSignalKey, number> = {
  funding: 0.22,
  hiring: 0.19,
  news: 0.18,
  technology: 0.18,
};

function legacyHiringMultiplier(detail: string): number {
  const lower = detail.toLowerCase();
  if (/\b(vp|head of|director|chief|cro|cmo|cso|president|founder)\b/.test(lower)) return 1.4;
  if (/\b(senior|lead|manager)\b/.test(lower)) return 1.1;
  return 1;
}

function computeLegacyIntentScore(
  company: string,
  domain: string,
  signals: SignalSet,
  now: Date
): ScoreComputation {
  const latest = parseValidDate(signals.latestSignalDate, now);
  const keys = TRIGGER_KEYS;
  const scored = keys.map((key) => {
    const signal = signals[key];
    const isLegacyPayload = signal.status === undefined;
    const valid = Number.isFinite(signal.score) && Number.isFinite(signal.max) && signal.max > 0;
    let status = valid ? signal.status ?? inferLegacyStatus(signal) : "unavailable" as SignalStatus;
    const observedAt = parseValidDate(signal.observed_at, now) ?? (isLegacyPayload ? latest : null);
    const normalized = valid && (status === "ok" || status === "stale")
      ? 100 * clamp(signal.score / signal.max, 0, 1)
      : 0;

    if (normalized > 0 && !observedAt) status = "unavailable";

    const multiplier = key === "hiring" ? legacyHiringMultiplier(signal.detail) : 1;
    const rawScore = status === "ok" || status === "stale"
      ? Math.min(100, normalized * multiplier)
      : 0;
    const ageDays = rawScore > 0 && observedAt ? daysBetween(now, observedAt) : null;
    const freshness = rawScore > 0 && ageDays !== null ? Math.exp(-0.023 * ageDays) : 1;
    const effectiveWeight = LEGACY_WEIGHTS[key] * STATUS_COVERAGE_FACTOR[status];
    return {
      key,
      rawScore,
      decayedScore: rawScore * freshness,
      status,
      observedAt,
      ageDays,
      freshness,
      effectiveWeight,
    };
  });

  const baseWeightTotal = Object.values(LEGACY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const effectiveWeightTotal = scored.reduce((sum, signal) => sum + signal.effectiveWeight, 0);
  const coverage = effectiveWeightTotal / baseWeightTotal;
  const scoreStatus: ScoreStatus = coverage === 1
    ? "complete"
    : coverage >= PARTIAL_COVERAGE_THRESHOLD
      ? "partial"
      : "unscorable";
  const weighted = scored.reduce(
    (sum, signal) => sum + signal.decayedScore * signal.effectiveWeight,
    0
  ) * (effectiveWeightTotal > 0 ? baseWeightTotal / effectiveWeightTotal : 0);
  const activeCount = scored.filter(
    (signal) => signal.rawScore > 0 && signal.ageDays !== null && signal.ageDays <= 30
  ).length;
  const combinationMultiplier = activeCount >= 4
    ? 1.5
    : activeCount === 3
      ? 1.35
      : activeCount === 2
        ? 1.2
        : 1;
  const combined = Math.min(100, weighted * combinationMultiplier);
  const sigmoid = 100 / (1 + Math.exp(-0.08 * (combined - 50)));
  const finalScore = scoreStatus === "unscorable"
    ? null
    : clamp(Math.round((sigmoid - 50) * 1.6 + 50), 0, 100);
  const attributionTotal = scored.reduce(
    (sum, item) => sum + item.decayedScore * item.effectiveWeight,
    0
  );
  const triggerContributions: SignalContribution[] = TRIGGER_KEYS.map((key) => {
    const item = scored.find((signal) => signal.key === key)!;
    const signal = signals[key];
    const weightedContribution = item.decayedScore * item.effectiveWeight;
    return {
      type: key,
      status: item.status,
      rawScore: round(item.rawScore, 4),
      decayedScore: round(item.decayedScore, 4),
      freshness: round(item.freshness, 6),
      daysAgo: item.ageDays === null ? null : round(item.ageDays, 2),
      summary: signal.detail,
      baseWeight: LEGACY_WEIGHTS[key] * 100,
      effectiveWeight: item.effectiveWeight * 100,
      contribution: finalScore !== null && attributionTotal > 0
        ? round(finalScore * weightedContribution / attributionTotal, 4)
        : 0,
      observedAt: item.observedAt?.toISOString() ?? null,
    };
  });

  return {
    company,
    domain,
    intent_score: finalScore,
    score_band: finalScore === null ? null : getScoreBand(finalScore),
    last_updated: now.toISOString(),
    signals,
    score_decay_date: addDays(now, 30).toISOString(),
    scoring_version: LEGACY_SCORING_VERSION,
    score_status: scoreStatus,
    data_coverage: round(coverage, 4),
    contributions: triggerContributions,
    raw_score: finalScore === null ? null : Math.round(combined),
    confidence: round(coverage, 4),
  };
}

export function isScoringV2Enabled(value = process.env.SCORING_V2_ENABLED): boolean {
  return value !== "false";
}

export function getActiveScoringVersion(value = process.env.SCORING_V2_ENABLED): string {
  return isScoringV2Enabled(value) ? SCORING_VERSION : LEGACY_SCORING_VERSION;
}

export function computeActiveIntentScore(
  company: string,
  domain: string,
  signals: SignalSet,
  now = new Date(),
  v2Enabled = isScoringV2Enabled()
): ScoreComputation {
  return v2Enabled
    ? computeIntentScore(company, domain, signals, now)
    : computeLegacyIntentScore(company, domain, signals, now);
}

/** Uses the same normalization path as computeIntentScore for explanations/persistence. */
export function buildScoredSignals(signals: SignalSet, now = new Date()): ScoredSignal[] {
  return scoreSignals(signals, now).contributions;
}
