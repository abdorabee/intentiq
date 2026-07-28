export const SCHEMA_VERSION = "web-enrichment-v1";
export const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;
export const DEFAULT_SIGNAL_TYPES = [
  "hiring",
  "news",
  "technology",
  "web_activity",
];
export const SUPPORTED_SIGNAL_TYPES = [
  "funding",
  ...DEFAULT_SIGNAL_TYPES,
];
