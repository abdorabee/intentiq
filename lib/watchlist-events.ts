export const WATCHLIST_FOCUS_ADD_EVENT = "watchlist-focus-add";

export function focusWatchlistAdd() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WATCHLIST_FOCUS_ADD_EVENT));
  }
}
