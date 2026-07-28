export const MAP_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

export function startOfUtcDayIso(now = new Date()) {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )).toISOString();
}

export function canStartPageJob({ usedPages, dailyBudget, requestedPages }) {
  return Number.isFinite(usedPages) &&
    Number.isFinite(dailyBudget) &&
    Number.isFinite(requestedPages) &&
    usedPages >= 0 &&
    dailyBudget > 0 &&
    requestedPages > 0 &&
    usedPages + requestedPages <= dailyBudget;
}

export function isMapFresh(fetchedAt, now = new Date()) {
  const timestamp = fetchedAt ? new Date(fetchedAt).getTime() : Number.NaN;
  return Number.isFinite(timestamp) &&
    Math.max(0, now.getTime() - timestamp) <= MAP_FRESHNESS_MS;
}
