import { describe, expect, it } from "vitest";

import {
  ACTIVE_PRODUCT_TOUR_VERSION,
  PRODUCT_TOUR_STEPS,
  createTourClientState,
  isProductTourVersionActive,
  reconcileTourVersion,
  tourReducer,
  transitionTour,
  type TourProgress,
} from "./product-tour";

const UPDATED_AT = "2026-08-24T01:00:00.000Z";

function progress(overrides: Partial<TourProgress> = {}): TourProgress {
  return {
    tour_version: 1,
    tour_status: "in_progress",
    tour_step: 0,
    tour_updated_at: UPDATED_AT,
    ...overrides,
  };
}

describe("product tour model", () => {
  it("keeps the checked-in rollout dormant until Task 10 changes the active version", () => {
    expect(ACTIVE_PRODUCT_TOUR_VERSION).toBe(0);
    expect(reconcileTourVersion(progress({ tour_version: 0 }), ACTIVE_PRODUCT_TOUR_VERSION)).toEqual({
      playable: false,
      progress: progress({ tour_version: 0 }),
      upgraded: false,
    });
    expect(isProductTourVersionActive(3, ACTIVE_PRODUCT_TOUR_VERSION)).toBe(false);
    expect(isProductTourVersionActive(1, 1)).toBe(true);
  });

  it("defines the five route-aware product stops without exposing Assistant navigation", () => {
    expect(PRODUCT_TOUR_STEPS.map(({ route, target }) => ({ route, target }))).toEqual([
      { route: "/dashboard", target: "dashboard-overview" },
      { route: "/score", target: "score-domain" },
      { route: "/pipeline", target: "intent-hub-prioritization" },
      { route: "/assistant", target: "assistant-workspace" },
      { route: "/dashboard", target: "navigation-settings" },
    ]);
  });

  it("resets a completed older version without replaying the same completed version", () => {
    expect(reconcileTourVersion(progress({ tour_version: 1, tour_status: "completed", tour_step: 4 }), 2)).toEqual({
      playable: true,
      progress: {
        tour_version: 2,
        tour_status: "not_started",
        tour_step: 0,
        tour_updated_at: UPDATED_AT,
      },
      upgraded: true,
    });
    expect(reconcileTourVersion(progress({ tour_status: "completed", tour_step: 4 }), 1).playable).toBe(false);
  });

  it("moves forward and backward only within the five bounded steps", () => {
    expect(transitionTour(progress({ tour_step: 3 }), "next", 1).tour_step).toBe(4);
    expect(transitionTour(progress({ tour_step: 4 }), "next", 1).tour_step).toBe(4);
    expect(transitionTour(progress({ tour_step: 1 }), "back", 1).tour_step).toBe(0);
    expect(transitionTour(progress({ tour_step: 0 }), "back", 1).tour_step).toBe(0);
  });

  it("supports start, restart, skip, dismissal, and finish as explicit transitions", () => {
    expect(transitionTour(progress({ tour_status: "not_started" }), "start", 1)).toMatchObject({ tour_status: "in_progress", tour_step: 0 });
    expect(transitionTour(progress({ tour_status: "completed", tour_step: 4 }), "restart", 1)).toMatchObject({ tour_status: "in_progress", tour_step: 0 });
    expect(transitionTour(progress({ tour_step: 2 }), "skip", 1)).toMatchObject({ tour_status: "dismissed", tour_step: 2 });
    expect(transitionTour(progress({ tour_step: 2 }), "dismiss", 1)).toMatchObject({ tour_status: "dismissed", tour_step: 2 });
    expect(transitionTour(progress({ tour_step: 4 }), "finish", 1)).toMatchObject({ tour_status: "completed", tour_step: 4 });
  });

  it("keeps confirmed progress visible while a transition is pending", () => {
    const initial = createTourClientState(progress({ tour_step: 1 }));
    const pending = tourReducer(initial, { type: "transition", action: "next", activeVersion: 1 });
    expect(pending.progress.tour_step).toBe(1);
    expect(pending.saving).toBe(true);
    expect(pending.pendingAction).toBe("next");

    const rolledBack = tourReducer(pending, { type: "failed", message: "Tour progress could not be saved." });
    expect(rolledBack.progress.tour_step).toBe(1);
    expect(rolledBack.error).toBe("Tour progress could not be saved.");
    expect(rolledBack.pendingAction).toBeNull();
  });

  it("reconciles a complete authoritative response after an optimistic transition", () => {
    const initial = createTourClientState(progress({ tour_step: 1 }));
    const optimistic = tourReducer(initial, { type: "transition", action: "next", activeVersion: 1 });
    const authoritative = progress({ tour_step: 2, tour_updated_at: "2026-08-24T01:01:00.000Z" });
    expect(tourReducer(optimistic, { type: "persisted", progress: authoritative })).toEqual({
      progress: authoritative,
      confirmed: authoritative,
      saving: false,
      error: null,
      pendingAction: null,
    });
  });
});
