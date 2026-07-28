import type { ScoreBand } from "./types";

export interface V2TransitionResultLike {
  intent_score: number | null;
  score_band: ScoreBand | null;
  previous_v2_score?: number | null;
  previous_v2_band?: ScoreBand | null;
  is_baseline: boolean;
  automation_eligible: boolean;
  cached: boolean;
  idempotent_replayed?: boolean;
}

export interface V2ScoreTransition {
  previousScore: number | null;
  previousBand: ScoreBand | null;
  hasComparison: boolean;
  scoreChanged: boolean;
  bandChanged: boolean;
  hotCrossing: boolean;
  canTriggerAutomation: boolean;
  canMovePipeline: boolean;
}

/**
 * Derive every automation decision from persisted v2 state. Baselines establish
 * comparison state, while cached/replayed/unchanged results cannot create a new
 * transition or repeat an action.
 */
export function evaluateV2ScoreTransition(
  result: V2TransitionResultLike
): V2ScoreTransition {
  const previousScore = result.previous_v2_score ?? null;
  const previousBand = result.previous_v2_band ?? null;
  const hasCurrentScore = result.intent_score !== null && result.score_band !== null;
  const hasComparison = previousScore !== null && previousBand !== null;
  const scoreChanged = hasCurrentScore && hasComparison && previousScore !== result.intent_score;
  const bandChanged = hasCurrentScore && hasComparison && previousBand !== result.score_band;
  const hasTransition = scoreChanged || bandChanged;
  const isFreshResult = !result.cached && !result.idempotent_replayed;
  const canTriggerAutomation =
    hasCurrentScore &&
    hasComparison &&
    !result.is_baseline &&
    result.automation_eligible &&
    isFreshResult &&
    hasTransition;

  return {
    previousScore,
    previousBand,
    hasComparison,
    scoreChanged,
    bandChanged,
    hotCrossing:
      canTriggerAutomation &&
      previousBand !== "HOT" &&
      result.score_band === "HOT",
    canTriggerAutomation,
    canMovePipeline: canTriggerAutomation,
  };
}
