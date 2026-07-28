import { describe, expect, it } from "vitest";
import {
  isOutcomeDatasetReady,
  parseScoreOutcomeInput,
} from "./score-outcomes";

describe("score outcome feedback", () => {
  it("accepts bounded manual outcome data", () => {
    expect(parseScoreOutcomeInput({
      score_id: "2c75f876-2fc5-4e8f-a791-521444143845",
      outcome: "closed_won",
      occurred_at: "2026-07-27T12:00:00.000Z",
      value: 24000,
      reason: "Expansion project",
    })).toEqual({
      scoreId: "2c75f876-2fc5-4e8f-a791-521444143845",
      outcome: "closed_won",
      occurredAt: "2026-07-27T12:00:00.000Z",
      value: 24000,
      reason: "Expansion project",
    });
  });

  it("rejects invalid outcomes, negative values, and malformed score IDs", () => {
    expect(parseScoreOutcomeInput({ score_id: "bad", outcome: "won" })).toBeNull();
    expect(parseScoreOutcomeInput({
      score_id: "2c75f876-2fc5-4e8f-a791-521444143845",
      outcome: "closed_lost",
      value: -1,
    })).toBeNull();
  });

  it("waits for 200 labels and 30 positives before learned-weight evaluation", () => {
    expect(isOutcomeDatasetReady({ total: 199, positives: 100 })).toBe(false);
    expect(isOutcomeDatasetReady({ total: 300, positives: 29 })).toBe(false);
    expect(isOutcomeDatasetReady({ total: 200, positives: 30 })).toBe(true);
  });
});
