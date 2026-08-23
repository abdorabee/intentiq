import { z } from "zod";

import { tourStatusSchema, type TourStatus } from "@/lib/user-preferences";

export const ACTIVE_PRODUCT_TOUR_VERSION = 0;

export const PRODUCT_TOUR_STEPS = [
  {
    id: "workspace-overview",
    title: "Workspace overview",
    description: "See active intent, account movement, and the signals that need attention from one workspace.",
    route: "/dashboard",
    target: "dashboard-overview",
    placement: "bottom",
  },
  {
    id: "score-domain",
    title: "Score a company domain",
    description: "Enter a company domain to verify current buying signals and generate an evidence-backed intent score.",
    route: "/score",
    target: "score-domain",
    placement: "bottom",
  },
  {
    id: "intent-hub",
    title: "Prioritize in Intent Hub",
    description: "Work the highest-intent accounts first, then move them through the pipeline as their signals change.",
    route: "/pipeline",
    target: "intent-hub-prioritization",
    placement: "bottom",
  },
  {
    id: "assistant",
    title: "Work with Assistant",
    description: "Use the composer and generated results to turn account intelligence into focused next actions.",
    route: "/assistant",
    target: "assistant-workspace",
    placement: "top",
  },
  {
    id: "navigation-settings",
    title: "Navigate and adjust Settings",
    description: "Use the workspace navigation to move between research tools and revisit product guidance in Settings.",
    route: "/dashboard",
    target: "navigation-settings",
    placement: "right",
    opensMobileNavigation: true,
  },
] as const;

export type TourAction = "start" | "restart" | "next" | "back" | "skip" | "dismiss" | "finish";

export const tourProgressSchema = z.strictObject({
  tour_version: z.number().int().nonnegative(),
  tour_status: tourStatusSchema,
  tour_step: z.number().int().min(0).max(PRODUCT_TOUR_STEPS.length - 1),
  tour_updated_at: z.iso.datetime({ offset: true }).nullable(),
});

export type TourProgress = z.infer<typeof tourProgressSchema>;

export const tourMutationRequestSchema = z.strictObject({
  action: z.enum(["start", "restart", "next", "back", "skip", "dismiss", "finish"]),
  expected: z.strictObject({
    version: z.number().int().nonnegative(),
    status: tourStatusSchema,
    step: z.number().int().min(0).max(PRODUCT_TOUR_STEPS.length - 1),
  }),
});

export function tourProgressFromPreferences(preferences: {
  tour_version: number;
  tour_status: TourStatus;
  tour_step: number;
  tour_updated_at: string | null;
}): TourProgress {
  return tourProgressSchema.parse({
    tour_version: preferences.tour_version,
    tour_status: preferences.tour_status,
    tour_step: preferences.tour_step,
    tour_updated_at: preferences.tour_updated_at,
  });
}

export function reconcileTourVersion(progress: TourProgress, activeVersion: number): {
  playable: boolean;
  progress: TourProgress;
  upgraded: boolean;
} {
  if (activeVersion <= 0) return { playable: false, progress, upgraded: false };
  if (progress.tour_version < activeVersion) {
    return {
      playable: true,
      progress: {
        ...progress,
        tour_version: activeVersion,
        tour_status: "not_started",
        tour_step: 0,
      },
      upgraded: true,
    };
  }
  const playable = progress.tour_version === activeVersion
    && (progress.tour_status === "not_started" || progress.tour_status === "in_progress");
  return { playable, progress, upgraded: false };
}

export function isProductTourVersionActive(persistedVersion: number, activeVersion: number) {
  return activeVersion > 0 && persistedVersion === activeVersion;
}

export function transitionTour(progress: TourProgress, action: TourAction, activeVersion: number): TourProgress {
  if (activeVersion <= 0 || progress.tour_version > activeVersion) {
    throw new Error("The product tour is not active.");
  }

  if (action === "start") {
    const upgraded = progress.tour_version < activeVersion;
    if (!upgraded && progress.tour_status !== "not_started") {
      throw new Error("The product tour cannot be started from its current state.");
    }
    return {
      ...progress,
      tour_version: activeVersion,
      tour_status: "in_progress",
      tour_step: 0,
    };
  }

  if (action === "restart") {
    return {
      ...progress,
      tour_version: activeVersion,
      tour_status: "in_progress",
      tour_step: 0,
    };
  }

  if (progress.tour_version !== activeVersion || progress.tour_status !== "in_progress") {
    throw new Error("The product tour is not in progress.");
  }

  if (action === "next") {
    return { ...progress, tour_step: Math.min(PRODUCT_TOUR_STEPS.length - 1, progress.tour_step + 1) };
  }
  if (action === "back") {
    return { ...progress, tour_step: Math.max(0, progress.tour_step - 1) };
  }
  if (action === "skip" || action === "dismiss") {
    return { ...progress, tour_status: "dismissed" };
  }
  if (progress.tour_step !== PRODUCT_TOUR_STEPS.length - 1) {
    throw new Error("The product tour cannot be finished before the final step.");
  }
  return { ...progress, tour_status: "completed" };
}

export interface TourClientState {
  progress: TourProgress;
  confirmed: TourProgress;
  saving: boolean;
  error: string | null;
  pendingAction: TourAction | null;
}

export type TourReducerEvent =
  | { type: "transition"; action: TourAction; activeVersion: number }
  | { type: "persisted"; progress: TourProgress }
  | { type: "failed"; message: string }
  | { type: "hydrate"; progress: TourProgress };

export function createTourClientState(progress: TourProgress): TourClientState {
  return { progress, confirmed: progress, saving: false, error: null, pendingAction: null };
}

export function tourReducer(state: TourClientState, event: TourReducerEvent): TourClientState {
  if (event.type === "transition") {
    transitionTour(state.progress, event.action, event.activeVersion);
    return {
      ...state,
      saving: true,
      error: null,
      pendingAction: event.action,
    };
  }
  if (event.type === "persisted" || event.type === "hydrate") {
    return {
      progress: event.progress,
      confirmed: event.progress,
      saving: false,
      error: null,
      pendingAction: null,
    };
  }
  return {
    ...state,
    progress: state.confirmed,
    saving: false,
    error: event.message,
    pendingAction: null,
  };
}
