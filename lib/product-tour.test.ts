import { describe, expect, it } from "vitest";

import { PRODUCT_TOUR_VERSION, parsePreferencesPatch } from "./user-preferences";
import {
  PRODUCT_TOUR_STEPS,
  PRODUCT_TOUR_TARGET,
  clampTourIndex,
  isLastTourStep,
  isRectOnScreen,
  isScoreWorkspacePath,
  isTourDismissKey,
  nextFocusIndex,
  nextTourIndex,
  placeTourCard,
  previousTourIndex,
  productTourCompletionPatch,
  productTourRestartHref,
  productTourRestartPatch,
  resolveTourTarget,
  shouldAutoReplayProductTour,
  shouldStartProductTour,
  visibleTourSteps,
  type ProductTourStep,
  type TourRect,
} from "./product-tour";

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 800 };

const ON_SCREEN: TourRect = { top: 80, left: 240, width: 720, height: 220 };
const COMPOSER: TourRect = { top: 620, left: 240, width: 720, height: 56 };
const RESULT: TourRect = { top: 180, left: 260, width: 680, height: 240 };
const SIDEBAR_HUB: TourRect = { top: 168, left: 12, width: 208, height: 32 };
const SIDEBAR_SETTINGS: TourRect = { top: 420, left: 12, width: 208, height: 32 };
const OFFSCREEN_SIDEBAR: TourRect = { top: 168, left: -272, width: 272, height: 32 };
const MENU: TourRect = { top: 12, left: 12, width: 32, height: 32 };

function step(id: ProductTourStep["id"]): ProductTourStep {
  const found = PRODUCT_TOUR_STEPS.find((item) => item.id === id);
  if (!found) throw new Error(`Missing step ${id}`);
  return found;
}

describe("product tour step list", () => {
  it("ships the five Score → Hub → Settings steps", () => {
    expect(PRODUCT_TOUR_STEPS.map((item) => item.id)).toEqual([
      "score-workspace",
      "composer",
      "result",
      "intent-hub",
      "settings",
    ]);
    expect(PRODUCT_TOUR_STEPS.map((item) => item.title)).toEqual([
      "Score workspace",
      "Domain and follow-ups",
      "Generated result",
      "Intent Hub",
      "Settings",
    ]);
    expect(PRODUCT_TOUR_STEPS[2]?.fallbackTarget).toBe(PRODUCT_TOUR_TARGET.composer);
    expect(PRODUCT_TOUR_STEPS[3]?.fallbackTarget).toBe(PRODUCT_TOUR_TARGET.menu);
    expect(PRODUCT_TOUR_STEPS[4]?.fallbackTarget).toBe(PRODUCT_TOUR_TARGET.menu);
  });
});

describe("product tour persistence", () => {
  it("persists completion through a valid preferences patch", () => {
    const patch = productTourCompletionPatch();
    expect(patch).toEqual({
      product_tour_completed: true,
      product_tour_version: PRODUCT_TOUR_VERSION,
    });
    const parsed = parsePreferencesPatch(patch);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(patch);
    }
  });

  it("does not auto-replay after completion", () => {
    expect(shouldAutoReplayProductTour({ product_tour_completed: true })).toBe(false);
    expect(shouldStartProductTour({ product_tour_completed: true }, "/score")).toBe(false);
    expect(shouldStartProductTour({ product_tour_completed: true }, "/dashboard")).toBe(false);
    expect(shouldStartProductTour({ product_tour_completed: true }, "/settings/experience")).toBe(
      false
    );
  });

  it("starts on Score when the restart flag is cleared", () => {
    const patch = productTourRestartPatch();
    expect(patch).toEqual({ product_tour_completed: false });
    expect(parsePreferencesPatch(patch).success).toBe(true);
    expect(shouldStartProductTour({ product_tour_completed: false }, "/score")).toBe(true);
    expect(shouldStartProductTour({ product_tour_completed: false }, "/score/")).toBe(true);
    expect(shouldStartProductTour(undefined, "/score")).toBe(true);
    expect(shouldStartProductTour({ product_tour_completed: false }, "/settings/experience")).toBe(
      false
    );
    expect(productTourRestartHref("/settings/experience")).toBe("/score");
    expect(productTourRestartHref("/pipeline")).toBe("/score");
    expect(productTourRestartHref("/score")).toBeNull();
    expect(isScoreWorkspacePath("/score")).toBe(true);
    expect(isScoreWorkspacePath("/dashboard")).toBe(false);
  });
});

describe("product tour targeting", () => {
  it("uses primary targets on desktop and falls back when a result is missing", () => {
    const targets = {
      [PRODUCT_TOUR_TARGET.workspace]: ON_SCREEN,
      [PRODUCT_TOUR_TARGET.composer]: COMPOSER,
      [PRODUCT_TOUR_TARGET.result]: null,
      [PRODUCT_TOUR_TARGET.intentHub]: SIDEBAR_HUB,
      [PRODUCT_TOUR_TARGET.settings]: SIDEBAR_SETTINGS,
      [PRODUCT_TOUR_TARGET.menu]: null,
    };

    expect(resolveTourTarget(step("result"), targets, DESKTOP)?.targetId).toBe(
      PRODUCT_TOUR_TARGET.composer
    );
    expect(visibleTourSteps(PRODUCT_TOUR_STEPS, targets, DESKTOP).map((item) => item.id)).toEqual([
      "score-workspace",
      "composer",
      "result",
      "intent-hub",
      "settings",
    ]);
    expect(resolveTourTarget(step("result"), { ...targets, [PRODUCT_TOUR_TARGET.result]: RESULT }, DESKTOP)?.targetId).toBe(
      PRODUCT_TOUR_TARGET.result
    );
  });

  it("retargets off-screen sidebar steps to the menu and skips when nothing is visible", () => {
    const mobileTargets = {
      [PRODUCT_TOUR_TARGET.workspace]: { top: 60, left: 12, width: 366, height: 200 },
      [PRODUCT_TOUR_TARGET.composer]: { top: 280, left: 12, width: 366, height: 48 },
      [PRODUCT_TOUR_TARGET.result]: null,
      [PRODUCT_TOUR_TARGET.intentHub]: OFFSCREEN_SIDEBAR,
      [PRODUCT_TOUR_TARGET.settings]: { ...OFFSCREEN_SIDEBAR, top: 400 },
      [PRODUCT_TOUR_TARGET.menu]: MENU,
    };

    expect(isRectOnScreen(OFFSCREEN_SIDEBAR, MOBILE)).toBe(false);
    expect(resolveTourTarget(step("intent-hub"), mobileTargets, MOBILE)?.targetId).toBe(
      PRODUCT_TOUR_TARGET.menu
    );
    expect(resolveTourTarget(step("settings"), mobileTargets, MOBILE)?.targetId).toBe(
      PRODUCT_TOUR_TARGET.menu
    );

    const noMenu = { ...mobileTargets, [PRODUCT_TOUR_TARGET.menu]: null };
    expect(resolveTourTarget(step("intent-hub"), noMenu, MOBILE)).toBeNull();
    expect(visibleTourSteps(PRODUCT_TOUR_STEPS, noMenu, MOBILE).map((item) => item.id)).toEqual([
      "score-workspace",
      "composer",
      "result",
    ]);
  });
});

describe("product tour navigation helpers", () => {
  it("clamps next/back and treats Escape as dismiss", () => {
    expect(clampTourIndex(8, 5)).toBe(4);
    expect(nextTourIndex(3, 5)).toBe(4);
    expect(nextTourIndex(4, 5)).toBe(4);
    expect(previousTourIndex(0)).toBe(0);
    expect(previousTourIndex(2)).toBe(1);
    expect(isLastTourStep(4, 5)).toBe(true);
    expect(isLastTourStep(3, 5)).toBe(false);
    expect(isTourDismissKey("Escape")).toBe(true);
    expect(isTourDismissKey("Tab")).toBe(false);
    expect(nextFocusIndex(0, 3, false)).toBe(1);
    expect(nextFocusIndex(2, 3, false)).toBe(0);
    expect(nextFocusIndex(0, 3, true)).toBe(2);
  });

  it("keeps the card inside the viewport", () => {
    const placed = placeTourCard(
      { top: 720, left: 1100, width: 160, height: 40 },
      { width: 320, height: 160 },
      DESKTOP
    );
    expect(placed.left).toBeGreaterThanOrEqual(12);
    expect(placed.left + 320).toBeLessThanOrEqual(DESKTOP.width - 12);
    expect(placed.top).toBeGreaterThanOrEqual(12);
    expect(placed.top + 160).toBeLessThanOrEqual(DESKTOP.height - 12);
  });
});
