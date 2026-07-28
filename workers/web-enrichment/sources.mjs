import { isIP } from "node:net";
import { SUPPORTED_SIGNAL_TYPES } from "./contract.mjs";

export const SIGNAL_TYPES = SUPPORTED_SIGNAL_TYPES;
export const MIN_CONFIDENCE = 0.8;
export const MAX_CANDIDATE_URLS = 5;

const PATH_HINTS = [
  "news",
  "press",
  "media",
  "blog",
  "announcement",
  "company",
  "about",
  "careers",
  "career",
  "jobs",
  "changelog",
  "release",
  "product",
  "integration",
  "partner",
  "technology",
  "funding",
  "investor",
];

const HINTS_BY_SIGNAL = {
  funding: ["news", "press", "announcement", "investor", "funding"],
  hiring: ["careers", "career", "jobs"],
  news: ["news", "press", "media", "blog", "announcement"],
  technology: ["changelog", "release", "product", "integration", "partner", "technology"],
  web_activity: ["pricing", "changelog", "release", "product", "integration", "blog", "news"],
};

export function canonicalizeDomain(input) {
  const value = String(input || "").trim().toLowerCase().replace(/\.$/, "");
  const hostname = value.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  const labels = hostname.split(".");
  const valid = labels.length >= 2 && labels.every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
  );
  if (!valid || hostname.length > 253 || isIP(hostname) !== 0 || hostname === "localhost") {
    throw new Error("Invalid public company domain");
  }
  return hostname;
}

export function isCompanyOwnedHttpsUrl(value, domain) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (hostname === domain || hostname.endsWith(`.${domain}`))
    );
  } catch {
    return false;
  }
}

function linkUrl(link) {
  return typeof link === "string" ? link : link && typeof link.url === "string" ? link.url : "";
}

function linkSearchText(link) {
  if (typeof link === "string") return link;
  return [link?.url, link?.title, link?.description].filter(Boolean).join(" ");
}

export function selectCandidateUrls(links, domain, requestedSignals = SIGNAL_TYPES) {
  const ranked = new Map();
  const root = `https://${domain}/`;
  ranked.set(root, 0.5);
  const requested = (Array.isArray(requestedSignals) ? requestedSignals : [])
    .filter((signal) => SIGNAL_TYPES.includes(signal));
  const activeHints = new Set(
    (requested.length > 0 ? requested : SIGNAL_TYPES)
      .flatMap((signal) => HINTS_BY_SIGNAL[signal] ?? PATH_HINTS)
  );

  for (const link of Array.isArray(links) ? links : []) {
    const value = linkUrl(link);
    if (!isCompanyOwnedHttpsUrl(value, domain)) continue;
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) url.searchParams.delete(key);
    const canonical = url.toString();
    const searchText = linkSearchText(link).toLowerCase();
    const score = [...activeHints].reduce(
      (total, hint) => total + (searchText.includes(hint) ? 1 : 0),
      0
    );
    if (score === 0) continue;
    ranked.set(canonical, Math.max(score, ranked.get(canonical) ?? 0));
  }

  return [...ranked.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_CANDIDATE_URLS)
    .map(([url]) => url);
}

function canonicalObservationKey(observation) {
  return [
    observation.signal_type,
    observation.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
    observation.observed_at.slice(0, 10),
    observation.source_url,
  ].join("|");
}

export function normalizeExtractedObservations(pages, domain, requestedSignals, now = new Date()) {
  const allowedSignals = new Set(
    (Array.isArray(requestedSignals) ? requestedSignals : [])
      .filter((signal) => SIGNAL_TYPES.includes(signal))
  );
  const deduplicated = new Map();

  for (const page of Array.isArray(pages) ? pages : []) {
    const sourceUrl = page?.metadata?.sourceURL || page?.metadata?.url;
    if (!isCompanyOwnedHttpsUrl(sourceUrl, domain)) continue;
    const events = Array.isArray(page?.json?.events) ? page.json.events : [];

    for (const event of events) {
      if (
        !event ||
        !allowedSignals.has(event.signal_type) ||
        typeof event.event_type !== "string" ||
        typeof event.title !== "string" ||
        typeof event.observed_at !== "string" ||
        typeof event.confidence !== "number" ||
        event.confidence < MIN_CONFIDENCE ||
        event.entity_match !== "exact"
      ) {
        continue;
      }
      const observedAt = new Date(event.observed_at);
      if (
        !Number.isFinite(observedAt.getTime()) ||
        observedAt.getTime() > now.getTime() + 5 * 60 * 1000
      ) {
        continue;
      }
      const observation = {
        signal_type: event.signal_type,
        event_type: event.event_type.trim().slice(0, 80),
        title: event.title.trim().slice(0, 300),
        observed_at: observedAt.toISOString(),
        source_url: new URL(sourceUrl).toString(),
        evidence_text: typeof event.evidence_text === "string"
          ? event.evidence_text.trim().slice(0, 500)
          : undefined,
        confidence: Math.min(1, event.confidence),
        entity_match: "exact",
        amount_usd: Number.isFinite(event.amount_usd) ? Math.max(0, event.amount_usd) : null,
        job_title: typeof event.job_title === "string" ? event.job_title.trim().slice(0, 200) : null,
        technology_name: typeof event.technology_name === "string"
          ? event.technology_name.trim().slice(0, 120)
          : null,
        technology_change: ["adopted", "removed"].includes(event.technology_change)
          ? event.technology_change
          : null,
      };
      if (!observation.title) continue;
      const key = canonicalObservationKey(observation);
      const existing = deduplicated.get(key);
      if (!existing || observation.confidence > existing.confidence) {
        deduplicated.set(key, observation);
      }
    }
  }

  return [...deduplicated.values()];
}
