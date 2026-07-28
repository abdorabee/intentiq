import { describe, expect, it } from "vitest";

import {
  chooseBestSignalEvidence,
  chooseHiringEvidencePriority,
  prepareEvidenceForPersistence,
  signalFromEvidenceRow,
  type SignalEvidenceRow,
} from "./score-evidence";

const now = new Date("2026-07-24T12:00:00.000Z");

function row(overrides: Partial<SignalEvidenceRow> = {}): SignalEvidenceRow {
  return {
    canonical_domain: "acme.com",
    signal_type: "news",
    source: "gnews",
    schema_version: "signal-evidence-v1",
    status: "no_signal",
    observed_at: null,
    fetched_at: "2026-07-24T10:00:00.000Z",
    expires_at: "2026-07-31T10:00:00.000Z",
    evidence: [],
    raw_payload: {},
    shadow: false,
    ...overrides,
  };
}

describe("best signal evidence selection", () => {
  it("selects a fresh promoted exact-match event without combining sources", () => {
    const selected = chooseBestSignalEvidence([
      row(),
      row({
        source: "firecrawl",
        schema_version: "web-enrichment-v1",
        status: "ok",
        observed_at: "2026-07-23T00:00:00.000Z",
        raw_payload: {
          observations: [{ confidence: 0.94, entity_match: "exact" }],
        },
      }),
    ], now);
    expect(selected?.source).toBe("firecrawl");
  });

  it("ignores shadow and low-confidence crawler rows", () => {
    const primary = row();
    expect(chooseBestSignalEvidence([
      primary,
      row({
        source: "firecrawl",
        status: "ok",
        shadow: true,
        raw_payload: {
          observations: [{ confidence: 0.99, entity_match: "exact" }],
        },
      }),
      row({
        source: "firecrawl",
        status: "ok",
        raw_payload: {
          observations: [{ confidence: 0.5, entity_match: "exact" }],
        },
      }),
    ], now)).toBe(primary);
  });

  it("prefers a fresh source over stale positive evidence", () => {
    const selected = chooseBestSignalEvidence([
      row({
        status: "stale",
        observed_at: "2026-07-23T00:00:00.000Z",
        fetched_at: "2026-07-20T00:00:00.000Z",
      }),
      row({ source: "gnews", status: "no_signal" }),
    ], now);
    expect(selected?.status).toBe("no_signal");
  });
});

describe("evidence persistence preparation", () => {
  it("preserves unexpired last-known-good evidence across a provider outage", () => {
    const retained = row({
      signal_type: "hiring",
      source: "explorium-events",
      fetched_at: "2026-07-24T03:00:00.000Z",
      raw_payload: { score: 8, max: 20, detail: "retained evidence" },
    });
    const outage = row({
      signal_type: "hiring",
      source: "explorium-events",
      status: "unavailable",
      fetched_at: "2026-07-24T11:59:00.000Z",
      observed_at: null,
      evidence: [],
      raw_payload: { score: 0, max: 20, detail: "provider timeout" },
    });

    expect(prepareEvidenceForPersistence([retained, outage], now)).toEqual([retained]);
  });

  it("persists the failed refresh after retained evidence expires", () => {
    const expired = row({
      signal_type: "hiring",
      source: "explorium-events",
      fetched_at: "2026-07-16T03:00:00.000Z",
      expires_at: "2026-07-24T11:00:00.000Z",
    });
    const outage = row({
      signal_type: "hiring",
      source: "explorium-events",
      status: "unavailable",
      fetched_at: "2026-07-24T11:59:00.000Z",
      observed_at: null,
      evidence: [],
    });

    expect(prepareEvidenceForPersistence([expired, outage], now)).toEqual([outage]);
  });
});

describe("stored evidence decoding", () => {
  it("decodes promoted Firecrawl web activity into a graded signal", () => {
    const decoded = signalFromEvidenceRow(row({
      signal_type: "web_activity",
      source: "firecrawl",
      schema_version: "web-enrichment-v1",
      status: "ok",
      observed_at: "2026-07-24T10:00:00.000Z",
      raw_payload: {
        observations: [{
          signal_type: "web_activity",
          event_type: "pricing_change",
          title: "Pricing page materially changed",
          observed_at: "2026-07-24T10:00:00.000Z",
          source_url: "https://acme.com/pricing",
          confidence: 0.95,
          entity_match: "exact",
        }],
      },
    }));

    expect(decoded).toMatchObject({
      score: 12,
      max: 15,
      status: "ok",
      source: "firecrawl",
      metadata: {
        selected_source: "firecrawl",
      },
    });
  });
});

describe("hiring evidence priority compatibility", () => {
  it("retains the existing fresh-primary behavior", () => {
    expect(chooseHiringEvidencePriority(
      row({ signal_type: "hiring", source: "explorium-events" }),
      row({ signal_type: "hiring", source: "scrapling" }),
      now
    )).toBe("primary");
  });
});
