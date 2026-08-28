import { PRODUCT_TOUR_VERSION } from "./user-preferences";

export const PRODUCT_TOUR_RESTART_EVENT = "vesperwise:product-tour-restart";

export const PRODUCT_TOUR_TARGET = {
  workspace: "score-workspace",
  composer: "score-composer",
  result: "score-result",
  intentHub: "nav-intent-hub",
  settings: "nav-settings",
  menu: "nav-menu",
} as const;

export type ProductTourTargetId = (typeof PRODUCT_TOUR_TARGET)[keyof typeof PRODUCT_TOUR_TARGET];

export interface ProductTourStep {
  id: "score-workspace" | "composer" | "result" | "intent-hub" | "settings";
  title: string;
  body: string;
  target: ProductTourTargetId;
  fallbackTarget?: ProductTourTargetId;
}

export const PRODUCT_TOUR_STEPS: readonly ProductTourStep[] = [
  {
    id: "score-workspace",
    title: "Score workspace",
    body: "This is where you score an account and stay in the thread for follow-ups.",
    target: PRODUCT_TOUR_TARGET.workspace,
  },
  {
    id: "composer",
    title: "Domain and follow-ups",
    body: "Paste a company domain to score, or ask a follow-up about the current account.",
    target: PRODUCT_TOUR_TARGET.composer,
  },
  {
    id: "result",
    title: "Generated result",
    body: "A scored account shows the thesis, triggers, and a recommended next action. If you skipped scoring, start from the composer.",
    target: PRODUCT_TOUR_TARGET.result,
    fallbackTarget: PRODUCT_TOUR_TARGET.composer,
  },
  {
    id: "intent-hub",
    title: "Intent Hub",
    body: "Intent Hub collects watchlisted accounts so you can see which ones are heating up.",
    target: PRODUCT_TOUR_TARGET.intentHub,
    fallbackTarget: PRODUCT_TOUR_TARGET.menu,
  },
  {
    id: "settings",
    title: "Settings",
    body: "Appearance, your selling profile, and a control to replay this tour live in Settings.",
    target: PRODUCT_TOUR_TARGET.settings,
    fallbackTarget: PRODUCT_TOUR_TARGET.menu,
  },
];

export const PRODUCT_TOUR_TARGET_IDS: readonly ProductTourTargetId[] = [
  PRODUCT_TOUR_TARGET.workspace,
  PRODUCT_TOUR_TARGET.composer,
  PRODUCT_TOUR_TARGET.result,
  PRODUCT_TOUR_TARGET.intentHub,
  PRODUCT_TOUR_TARGET.settings,
  PRODUCT_TOUR_TARGET.menu,
];

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourViewport {
  width: number;
  height: number;
}

export interface ResolvedTourTarget {
  targetId: ProductTourTargetId;
  rect: TourRect;
}

const MIN_VISIBLE_PX = 24;

export function isScoreWorkspacePath(pathname: string): boolean {
  return pathname === "/score" || pathname.startsWith("/score/");
}

export function shouldStartProductTour(
  preferences: { product_tour_completed?: boolean } | null | undefined,
  pathname: string
): boolean {
  if (!isScoreWorkspacePath(pathname)) return false;
  return preferences?.product_tour_completed !== true;
}

export function shouldAutoReplayProductTour(
  preferences: { product_tour_completed?: boolean } | null | undefined
): boolean {
  return preferences?.product_tour_completed !== true;
}

export function productTourCompletionPatch() {
  return {
    product_tour_completed: true,
    product_tour_version: PRODUCT_TOUR_VERSION,
  };
}

export function productTourRestartPatch() {
  return { product_tour_completed: false };
}

export function productTourRestartHref(pathname: string): string | null {
  return isScoreWorkspacePath(pathname) ? null : "/score";
}

export function isRectOnScreen(
  rect: TourRect | null | undefined,
  viewport: TourViewport,
  minVisible = MIN_VISIBLE_PX
): boolean {
  if (!rect || rect.width < 8 || rect.height < 8) return false;
  const visibleWidth = Math.min(rect.left + rect.width, viewport.width) - Math.max(rect.left, 0);
  const visibleHeight = Math.min(rect.top + rect.height, viewport.height) - Math.max(rect.top, 0);
  return visibleWidth >= minVisible && visibleHeight >= minVisible;
}

export function resolveTourTarget(
  step: ProductTourStep,
  targets: Partial<Record<ProductTourTargetId, TourRect | null>>,
  viewport: TourViewport
): ResolvedTourTarget | null {
  const primary = targets[step.target];
  if (isRectOnScreen(primary, viewport) && primary) {
    return { targetId: step.target, rect: primary };
  }
  if (step.fallbackTarget) {
    const fallback = targets[step.fallbackTarget];
    if (isRectOnScreen(fallback, viewport) && fallback) {
      return { targetId: step.fallbackTarget, rect: fallback };
    }
  }
  return null;
}

export function visibleTourSteps(
  steps: readonly ProductTourStep[],
  targets: Partial<Record<ProductTourTargetId, TourRect | null>>,
  viewport: TourViewport
): ProductTourStep[] {
  return steps.filter((step) => resolveTourTarget(step, targets, viewport) !== null);
}

export function clampTourIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

export function nextTourIndex(index: number, count: number): number {
  return clampTourIndex(index + 1, count);
}

export function previousTourIndex(index: number): number {
  return Math.max(0, index - 1);
}

export function isLastTourStep(index: number, count: number): boolean {
  return count <= 0 || index >= count - 1;
}

export function isTourDismissKey(key: string): boolean {
  return key === "Escape";
}

export function nextFocusIndex(currentIndex: number, count: number, shiftKey: boolean): number {
  if (count <= 0) return 0;
  if (shiftKey) return currentIndex <= 0 ? count - 1 : currentIndex - 1;
  return currentIndex >= count - 1 ? 0 : currentIndex + 1;
}

export function padTourRect(rect: TourRect, pad = 6): TourRect {
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

export function placeTourCard(
  target: TourRect,
  card: { width: number; height: number },
  viewport: TourViewport,
  gap = 12
): { top: number; left: number } {
  const pad = 12;
  const below = target.top + target.height + gap;
  const above = target.top - card.height - gap;
  const top =
    below + card.height + pad <= viewport.height
      ? below
      : above >= pad
        ? above
        : Math.max(pad, Math.min(below, viewport.height - card.height - pad));
  const preferredLeft = target.left;
  const left = Math.max(pad, Math.min(preferredLeft, viewport.width - card.width - pad));
  return { top, left };
}
