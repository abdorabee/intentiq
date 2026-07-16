import { describe, expect, it } from "vitest";

import {
  chooseHiringEvidencePriority,
  prepareEvidenceForPersistence,
  type SignalEvidenceRow,
} from "./score-evidence";

const NOW = new Date("2026-07-15T12:00:00.000Z");

function evidenceRow(overrides: Partial<SignalEvidenceRow> = {}): SignalEvidenceRow {
  return {
    canonical_domain: "acme.com",
    signal_type: "hiring",
    source: "explorium-events",
    schema_version: "signal-evidence-v1",
    status: "ok",
    observed_at: "2026-07-14T12:00:00.000Z",
    fetched_at: "2026-07-15T10:00:00.000Z",
    expires_at: "2026-07-22T12:00:00.000Z",
    evidence: [{ label: "Director of Sales" }],
    raw_payload: { score: 8, max: 20, detail: "Director of Sales" },
    shadow: false,
    ...overrides,
  };
}

describe("prepareEvidenceForPersistence", () => {
  it("preserves unexpired last-known-good evidence across a provider outage", () => {
    const retained = evidenceRow({
      fetched_at: "2026-07-15T03:00:00.000Z",
      raw_payload: { score: 8, max: 20, detail: "retained evidence" },
    });
    const outage = evidenceRow({
      status: "unavailable",
      fetched_at: "2026-07-15T11:59:00.000Z",
      observed_at: null,
      evidence: [],
      raw_payload: { score: 0, max: 20, detail: "provider timeout" },
    });

    expect(prepareEvidenceForPersistence([retained, outage], NOW)).toEqual([retained]);
  });

  it("persists the failed refresh once the retained evidence has expired", () => {
    const expired = evidenceRow({
      fetched_at: "2026-07-08T03:00:00.000Z",
      expires_at: "2026-07-15T11:00:00.000Z",
    });
    const outage = evidenceRow({
      status: "unavailable",
      fetched_at: "2026-07-15T11:59:00.000Z",
      observed_at: null,
      evidence: [],
    });

    expect(prepareEvidenceForPersistence([expired, outage], NOW)).toEqual([outage]);
  });
});

describe("chooseHiringEvidencePriority", () => {
  const freshPrimary = evidenceRow();
  const stalePrimary = evidenceRow({ fetched_at: "2026-07-15T03:00:00.000Z" });
  const freshScrapling = evidenceRow({
    source: "scrapling",
    schema_version: "hiring-v2",
    fetched_at: "2026-07-15T11:00:00.000Z",
  });
  const staleScrapling = evidenceRow({
    source: "scrapling",
    schema_version: "hiring-v2",
    fetched_at: "2026-07-15T02:00:00.000Z",
  });

  it("always prefers fresh Explorium over promoted Scrapling evidence", () => {
    expect(chooseHiringEvidencePriority(freshPrimary, freshScrapling, NOW)).toBe("primary");
  });

  it("prefers fresh promoted Scrapling after the primary evidence becomes stale", () => {
    expect(chooseHiringEvidencePriority(stalePrimary, freshScrapling, NOW)).toBe("scrapling");
  });

  it("uses stale Explorium LKG when both fallbacks are stale", () => {
    expect(chooseHiringEvidencePriority(stalePrimary, staleScrapling, NOW)).toBe("primary");
  });

  it("ignores worker evidence that remains in shadow mode", () => {
    expect(chooseHiringEvidencePriority(null, { ...freshScrapling, shadow: true }, NOW)).toBeNull();
  });
});
