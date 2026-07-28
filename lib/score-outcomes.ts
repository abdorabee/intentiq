export const SCORE_OUTCOMES = [
  "closed_won",
  "closed_lost",
  "no_decision",
  "disqualified",
] as const;

export type ScoreOutcome = (typeof SCORE_OUTCOMES)[number];

export interface ScoreOutcomeInput {
  scoreId: string;
  outcome: ScoreOutcome;
  occurredAt: string;
  value: number | null;
  reason: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isScoreId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseScoreOutcomeInput(
  value: unknown,
  now = new Date()
): ScoreOutcomeInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    !isScoreId(input.score_id) ||
    typeof input.outcome !== "string" ||
    !SCORE_OUTCOMES.includes(input.outcome as ScoreOutcome)
  ) {
    return null;
  }
  const occurredAt = typeof input.occurred_at === "string"
    ? new Date(input.occurred_at)
    : now;
  if (
    !Number.isFinite(occurredAt.getTime()) ||
    occurredAt.getTime() > now.getTime() + 5 * 60 * 1000
  ) {
    return null;
  }
  const amount = input.value === undefined || input.value === null
    ? null
    : input.value;
  if (
    amount !== null &&
    (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)
  ) {
    return null;
  }
  const reason = typeof input.reason === "string" && input.reason.trim()
    ? input.reason.trim().slice(0, 500)
    : null;

  return {
    scoreId: input.score_id,
    outcome: input.outcome as ScoreOutcome,
    occurredAt: occurredAt.toISOString(),
    value: amount as number | null,
    reason,
  };
}

export function isOutcomeDatasetReady(input: {
  total: number;
  positives: number;
}): boolean {
  return input.total >= 200 && input.positives >= 30;
}
