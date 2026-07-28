import { DEFAULT_SCORING_POLICY_V3 } from "./scorer";
import type { IntentSignalKey, ScoringPolicy } from "./types";

const SIGNAL_KEYS: IntentSignalKey[] = [
  "funding",
  "hiring",
  "news",
  "technology",
  "web_activity",
];

export interface ScoringPolicyRow {
  id: string;
  user_id: string | null;
  icp_key: string | null;
  vertical: string | null;
  policy: unknown;
  active: boolean;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numericRecord(
  value: unknown,
  predicate: (number: number) => boolean
): value is Record<IntentSignalKey, number> {
  return isRecord(value) && SIGNAL_KEYS.every(
    (key) => typeof value[key] === "number" &&
      Number.isFinite(value[key]) &&
      predicate(value[key])
  );
}

export function normalizeScoringPolicy(value: unknown): ScoringPolicy | null {
  if (!isRecord(value)) return null;
  const weights = value.weights;
  const halfLivesDays = value.halfLivesDays;
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.version !== "string" ||
    !value.version.trim() ||
    !numericRecord(weights, (number) => number > 0) ||
    !numericRecord(halfLivesDays, (number) => number > 0) ||
    typeof value.minimumCoverage !== "number" ||
    !Number.isFinite(value.minimumCoverage) ||
    value.minimumCoverage < 0 ||
    value.minimumCoverage > 1 ||
    typeof value.minimumSignalEquivalent !== "number" ||
    !Number.isFinite(value.minimumSignalEquivalent) ||
    value.minimumSignalEquivalent < 1 ||
    value.minimumSignalEquivalent > SIGNAL_KEYS.length
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    version: value.version.trim(),
    weights: Object.fromEntries(
      SIGNAL_KEYS.map((key) => [key, weights[key]])
    ) as ScoringPolicy["weights"],
    halfLivesDays: Object.fromEntries(
      SIGNAL_KEYS.map((key) => [key, halfLivesDays[key]])
    ) as ScoringPolicy["halfLivesDays"],
    minimumCoverage: value.minimumCoverage,
    minimumSignalEquivalent: value.minimumSignalEquivalent,
    vertical: typeof value.vertical === "string" ? value.vertical : null,
    icpKey: typeof value.icpKey === "string" ? value.icpKey : null,
  };
}

function normalized(value: string | null | undefined): string | null {
  const result = value?.trim().toLowerCase();
  return result ? result : null;
}

export function resolveScoringPolicy(
  rows: readonly ScoringPolicyRow[],
  input: {
    userId: string;
    profileHash: string;
    verticals: readonly string[];
  }
): ScoringPolicy {
  const verticals = new Set(input.verticals.map(normalized).filter(Boolean));
  const candidates = rows.flatMap((row) => {
    if (!row.active) return [];
    const policy = normalizeScoringPolicy(row.policy);
    return policy ? [{ row, policy }] : [];
  });
  const ranked = candidates
    .map(({ row, policy }) => {
      const rowVertical = normalized(row.vertical);
      const verticalMatch = rowVertical !== null && verticals.has(rowVertical);
      let rank = -1;
      if (row.user_id === input.userId && row.icp_key === input.profileHash) rank = 5;
      else if (row.user_id === input.userId && verticalMatch) rank = 4;
      else if (row.user_id === input.userId && row.icp_key === null && rowVertical === null) rank = 3;
      else if (row.user_id === null && verticalMatch) rank = 2;
      else if (row.user_id === null && row.icp_key === null && rowVertical === null) rank = 1;
      return { row, policy, rank };
    })
    .filter((item) => item.rank >= 0)
    .sort((a, b) =>
      b.rank - a.rank ||
      new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime()
    );

  return ranked[0]?.policy ?? DEFAULT_SCORING_POLICY_V3;
}
