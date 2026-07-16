import { describe, expect, it } from "vitest";

import { evaluateV2ScoreTransition } from "./score-transition";

describe("v2 score transitions", () => {
  it("establishes a HOT baseline without treating it as an automation transition", () => {
    const transition = evaluateV2ScoreTransition({
      intent_score: 82,
      score_band: "HOT",
      previous_v2_score: null,
      previous_v2_band: null,
      is_baseline: true,
      automation_eligible: false,
      cached: false,
    });

    expect(transition).toMatchObject({
      hasComparison: false,
      hotCrossing: false,
      canTriggerAutomation: false,
      canMovePipeline: false,
    });
  });

  it("does not create a false transition for an unchanged second v2 score", () => {
    const transition = evaluateV2ScoreTransition({
      intent_score: 82,
      score_band: "HOT",
      previous_v2_score: 82,
      previous_v2_band: "HOT",
      is_baseline: false,
      automation_eligible: true,
      cached: false,
    });

    expect(transition).toMatchObject({
      hasComparison: true,
      scoreChanged: false,
      bandChanged: false,
      hotCrossing: false,
      canTriggerAutomation: false,
      canMovePipeline: false,
    });
  });

  it("allows a fresh WARM-to-HOT v2 transition", () => {
    const transition = evaluateV2ScoreTransition({
      intent_score: 78,
      score_band: "HOT",
      previous_v2_score: 68,
      previous_v2_band: "WARM",
      is_baseline: false,
      automation_eligible: true,
      cached: false,
    });

    expect(transition).toMatchObject({
      scoreChanged: true,
      bandChanged: true,
      hotCrossing: true,
      canTriggerAutomation: true,
      canMovePipeline: true,
    });
  });

  it.each([
    { cached: true, idempotent_replayed: false },
    { cached: false, idempotent_replayed: true },
  ])("suppresses cached and idempotent replays", ({ cached, idempotent_replayed }) => {
    const transition = evaluateV2ScoreTransition({
      intent_score: 78,
      score_band: "HOT",
      previous_v2_score: 68,
      previous_v2_band: "WARM",
      is_baseline: false,
      automation_eligible: true,
      cached,
      idempotent_replayed,
    });

    expect(transition.hotCrossing).toBe(false);
    expect(transition.canTriggerAutomation).toBe(false);
    expect(transition.canMovePipeline).toBe(false);
  });
});
