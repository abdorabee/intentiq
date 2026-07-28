import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_POLICY_V3 } from "./scorer";
import {
  normalizeScoringPolicy,
  resolveScoringPolicy,
  type ScoringPolicyRow,
} from "./scoring-policy";

function row(
  id: string,
  overrides: Partial<ScoringPolicyRow> = {}
): ScoringPolicyRow {
  return {
    id,
    user_id: null,
    icp_key: null,
    vertical: null,
    policy: {
      ...DEFAULT_SCORING_POLICY_V3,
      id,
    },
    active: true,
    created_at: "2026-07-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("scoring policy resolution", () => {
  it("prefers an organization ICP policy over vertical and global policies", () => {
    const selected = resolveScoringPolicy(
      [
        row("global"),
        row("vertical", { vertical: "fintech" }),
        row("org", { user_id: "user-1" }),
        row("org-icp", { user_id: "user-1", icp_key: "profile-1" }),
      ],
      {
        userId: "user-1",
        profileHash: "profile-1",
        verticals: ["FinTech"],
      }
    );

    expect(selected.id).toBe("org-icp");
  });

  it("falls back from vertical to the immutable default policy", () => {
    expect(resolveScoringPolicy(
      [row("vertical", { vertical: "healthcare" })],
      { userId: "user-1", profileHash: "profile-1", verticals: ["fintech"] }
    )).toEqual(DEFAULT_SCORING_POLICY_V3);
  });

  it("rejects malformed policies instead of silently changing score math", () => {
    expect(normalizeScoringPolicy({
      ...DEFAULT_SCORING_POLICY_V3,
      weights: { ...DEFAULT_SCORING_POLICY_V3.weights, funding: -1 },
    })).toBeNull();
    expect(normalizeScoringPolicy({
      ...DEFAULT_SCORING_POLICY_V3,
      halfLivesDays: { ...DEFAULT_SCORING_POLICY_V3.halfLivesDays, news: 0 },
    })).toBeNull();
    expect(normalizeScoringPolicy({
      ...DEFAULT_SCORING_POLICY_V3,
      minimumCoverage: 1.2,
    })).toBeNull();
  });
});
