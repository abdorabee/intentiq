import { MIN_CONFIDENCE, SIGNAL_TYPES } from "./sources.mjs";

export function parsePromotedSignals(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((signal) => signal.trim().toLowerCase())
      .filter((signal) => SIGNAL_TYPES.includes(signal))
  );
}

export function shouldPromoteSignal({ requestedShadow, signal, observations, allowlist }) {
  if (requestedShadow || !SIGNAL_TYPES.includes(signal)) return false;
  if (!parsePromotedSignals(allowlist).has(signal)) return false;
  const matching = Array.isArray(observations)
    ? observations.filter((item) => item.signal_type === signal)
    : [];
  return matching.length > 0 && matching.every(
    (item) => item.entity_match === "exact" && item.confidence >= MIN_CONFIDENCE
  );
}
