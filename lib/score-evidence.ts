import type { SignalStatus } from "./types";

const EVIDENCE_FRESHNESS_MS = 6 * 60 * 60 * 1000;

export interface SignalEvidenceRow {
  canonical_domain: string;
  signal_type: string;
  source: string;
  schema_version: string;
  status: SignalStatus;
  observed_at: string | null;
  fetched_at: string;
  expires_at: string | null;
  evidence: unknown;
  raw_payload: unknown;
  shadow: boolean;
}

function isUsableStatus(status: SignalStatus): boolean {
  return status === "ok" || status === "no_signal" || status === "stale";
}

function isFresh(row: SignalEvidenceRow, nowMs: number): boolean {
  const fetchedAt = new Date(row.fetched_at).getTime();
  return Number.isFinite(fetchedAt) && Math.max(0, nowMs - fetchedAt) <= EVIDENCE_FRESHNESS_MS;
}

/**
 * Collapse evidence upserts by their database identity. A transient failed
 * refresh never replaces an unexpired last-known-good row for the same source.
 */
export function prepareEvidenceForPersistence(
  rows: readonly SignalEvidenceRow[],
  now = new Date()
): SignalEvidenceRow[] {
  const groups = new Map<string, SignalEvidenceRow[]>();
  for (const row of rows) {
    const identity = [
      row.canonical_domain,
      row.signal_type,
      row.source,
      row.schema_version,
    ].join("|");
    groups.set(identity, [...(groups.get(identity) ?? []), row]);
  }

  return Array.from(groups.values()).map((group) => {
    const newestFirst = [...group].sort(
      (a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
    );
    const newest = newestFirst[0];
    const retainedGood = newestFirst.find((row) => {
      if (!isUsableStatus(row.status) || !row.expires_at) return false;
      const expiresAt = new Date(row.expires_at).getTime();
      return Number.isFinite(expiresAt) && expiresAt > now.getTime();
    });

    return !isUsableStatus(newest.status) && retainedGood ? retainedGood : newest;
  });
}

export type HiringEvidencePriority = "primary" | "scrapling" | null;

/**
 * Fresh Explorium hiring evidence always wins. After a failed primary refresh,
 * a fresh promoted Scrapling observation outranks stale Explorium LKG; when both
 * fallbacks are stale, the primary LKG remains authoritative.
 */
export function chooseHiringEvidencePriority(
  primaryRow: SignalEvidenceRow | null,
  scraplingRow: SignalEvidenceRow | null,
  now = new Date()
): HiringEvidencePriority {
  const usablePrimary = primaryRow && !primaryRow.shadow && isUsableStatus(primaryRow.status)
    ? primaryRow
    : null;
  const usableScrapling = scraplingRow && !scraplingRow.shadow && isUsableStatus(scraplingRow.status)
    ? scraplingRow
    : null;
  const nowMs = now.getTime();

  if (usablePrimary && usablePrimary.status !== "stale" && isFresh(usablePrimary, nowMs)) {
    return "primary";
  }
  if (usableScrapling && usableScrapling.status !== "stale" && isFresh(usableScrapling, nowMs)) {
    return "scrapling";
  }
  if (usablePrimary) return "primary";
  if (usableScrapling) return "scrapling";
  return null;
}
