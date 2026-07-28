import { shouldPromoteSignal } from "./promotion.mjs";

const EVIDENCE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function latestObservedAt(observations) {
  const timestamps = observations
    .map((item) => new Date(item.observed_at).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

export function evidenceRowsForResult({
  domain,
  schemaVersion,
  signals,
  observations,
  requestedShadow,
  promotedSignals,
  fetchedAt,
  firecrawlMetadata,
}) {
  return signals.map((signal) => {
    const signalObservations = observations.filter((item) => item.signal_type === signal);
    const promoted = shouldPromoteSignal({
      requestedShadow,
      signal,
      observations: signalObservations,
      allowlist: promotedSignals,
    });
    return {
      canonical_domain: domain,
      signal_type: signal,
      source: "firecrawl",
      schema_version: schemaVersion,
      status: signalObservations.length > 0 ? "ok" : "unavailable",
      observed_at: latestObservedAt(signalObservations),
      fetched_at: fetchedAt,
      expires_at: new Date(new Date(fetchedAt).getTime() + EVIDENCE_RETENTION_MS).toISOString(),
      evidence: signalObservations.map((item) => ({
        label: item.title,
        observed_at: item.observed_at,
        source: "firecrawl",
        fetched_at: fetchedAt,
        source_url: item.source_url,
        metadata: {
          event_type: item.event_type,
          confidence: item.confidence,
          entity_match: item.entity_match,
        },
      })),
      raw_payload: {
        domain,
        source: "firecrawl",
        schema_version: schemaVersion,
        fetched_at: fetchedAt,
        observations: signalObservations,
        metadata: firecrawlMetadata,
      },
      shadow: !promoted,
    };
  });
}
