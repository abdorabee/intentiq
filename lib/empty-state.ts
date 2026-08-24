export const EMPTY_STATE_SURFACES = [
  "dashboard",
  "history",
  "people",
  "watchlist",
  "lists",
  "inbox",
] as const;

export type EmptyStateSurface = (typeof EMPTY_STATE_SURFACES)[number];
export type EmptyStateKind = "zero" | "filtered";

export type EmptyStateCopy = {
  title: string;
  description: string;
  actionLabel: string | null;
  actionHref: string | null;
};

const ZERO: Record<EmptyStateSurface, EmptyStateCopy> = {
  dashboard: {
    title: "No scores yet",
    description: "Score a company to see intent, activity, and what to do next.",
    actionLabel: "Score a company",
    actionHref: "/score",
  },
  history: {
    title: "No scores yet",
    description: "Score a company to start a history you can search and export.",
    actionLabel: "Score a company",
    actionHref: "/score",
  },
  people: {
    title: "No people scored",
    description: "Score a person to see role, ICP fit, and who to contact.",
    actionLabel: "Score a person",
    actionHref: null,
  },
  watchlist: {
    title: "Watchlist is empty",
    description: "Add a company to track score changes and alerts.",
    actionLabel: "Add a company",
    actionHref: null,
  },
  lists: {
    title: "No lists yet",
    description: "Group accounts by signal, segment, or by hand.",
    actionLabel: "New list",
    actionHref: null,
  },
  inbox: {
    title: "Inbox is empty",
    description: "Score companies or watch accounts to get activity here.",
    actionLabel: "Score a company",
    actionHref: "/score",
  },
};

const FILTERED: Record<EmptyStateSurface, EmptyStateCopy> = {
  dashboard: {
    title: "No scores yet",
    description: "Score a company to see intent, activity, and what to do next.",
    actionLabel: null,
    actionHref: null,
  },
  history: {
    title: "No matching scores",
    description: "Try a different search or band filter.",
    actionLabel: null,
    actionHref: null,
  },
  people: {
    title: "No matching people",
    description: "Try a different search.",
    actionLabel: null,
    actionHref: null,
  },
  watchlist: {
    title: "No matching accounts",
    description: "Try a different search or list.",
    actionLabel: null,
    actionHref: null,
  },
  lists: {
    title: "No lists match",
    description: "Try a different search or filter.",
    actionLabel: null,
    actionHref: null,
  },
  inbox: {
    title: "Nothing here",
    description: "No items in this view.",
    actionLabel: null,
    actionHref: null,
  },
};

export function getEmptyStateCopy(
  surface: EmptyStateSurface,
  kind: EmptyStateKind = "zero"
): EmptyStateCopy {
  return kind === "filtered" ? FILTERED[surface] : ZERO[surface];
}

export function emptyStateHasAction(copy: EmptyStateCopy): boolean {
  return Boolean(copy.actionLabel);
}
