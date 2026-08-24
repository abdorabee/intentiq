import { describe, expect, it } from "vitest";

import {
  EMPTY_STATE_SURFACES,
  emptyStateHasAction,
  getEmptyStateCopy,
} from "./empty-state";

describe("empty-state copy", () => {
  it("covers History, People, Watchlist, Lists, Inbox, and Dashboard", () => {
    expect([...EMPTY_STATE_SURFACES].sort()).toEqual(
      ["dashboard", "history", "inbox", "lists", "people", "watchlist"].sort()
    );
  });

  it("uses title, one sentence, and one action for zero-data surfaces", () => {
    for (const surface of EMPTY_STATE_SURFACES) {
      const copy = getEmptyStateCopy(surface, "zero");
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.description.length).toBeGreaterThan(0);
      expect(copy.description.includes(".") || copy.description.includes("—")).toBe(true);
      expect(emptyStateHasAction(copy)).toBe(true);
      expect(copy.actionLabel).toBeTruthy();
    }
  });

  it("points dashboard, history, and inbox at Score", () => {
    expect(getEmptyStateCopy("dashboard").actionHref).toBe("/score");
    expect(getEmptyStateCopy("history").actionHref).toBe("/score");
    expect(getEmptyStateCopy("inbox").actionHref).toBe("/score");
  });

  it("keeps people, watchlist, and lists as in-page actions", () => {
    expect(getEmptyStateCopy("people").actionHref).toBeNull();
    expect(getEmptyStateCopy("watchlist").actionHref).toBeNull();
    expect(getEmptyStateCopy("lists").actionHref).toBeNull();
  });

  it("omits the action for filtered empties", () => {
    for (const surface of EMPTY_STATE_SURFACES) {
      const copy = getEmptyStateCopy(surface, "filtered");
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.description.length).toBeGreaterThan(0);
      expect(emptyStateHasAction(copy)).toBe(false);
      expect(copy.actionLabel).toBeNull();
      expect(copy.actionHref).toBeNull();
    }
  });
});
