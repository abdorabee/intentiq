import { createHash } from "node:crypto";
import { isCompanyOwnedHttpsUrl } from "./sources.mjs";

const MIN_CONTENT_LENGTH = 80;
const MIN_CHANGE_RATIO = 0.15;
const MAX_TOKEN_HASHES = 500;

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeContent(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?z\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenHashes(content) {
  const tokens = [...new Set(
    content
      .split(/[^a-z0-9$%]+/)
      .filter((token) => token.length >= 3)
      .map((token) => hash(token).slice(0, 16))
  )];
  return tokens.sort().slice(0, MAX_TOKEN_HASHES);
}

function changeRatio(previous, current) {
  const prior = new Set(Array.isArray(previous) ? previous : []);
  const next = new Set(Array.isArray(current) ? current : []);
  const union = new Set([...prior, ...next]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const value of prior) if (next.has(value)) intersection++;
  return 1 - intersection / union.size;
}

function eventTypeForUrl(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (/pricing|plans|packages/.test(path)) return "pricing_change";
  if (/changelog|release|features?|product/.test(path)) return "feature_launch";
  if (/integrations?|partners?/.test(path)) return "integration_change";
  if (/careers?|jobs?/.test(path)) return "careers_change";
  if (/blog|news|press/.test(path)) return "publication_change";
  return "meaningful_content_change";
}

function titleForChange(eventType, pageTitle) {
  const label = {
    pricing_change: "Pricing page materially changed",
    feature_launch: "Product or feature page materially changed",
    integration_change: "Integration page materially changed",
    careers_change: "Careers page materially changed",
    publication_change: "Company publication page materially changed",
    meaningful_content_change: "Company website materially changed",
  }[eventType];
  return pageTitle ? `${label}: ${pageTitle}` : label;
}

export function detectMeaningfulWebChanges({
  domain,
  pages,
  previousSnapshots,
  fetchedAt,
}) {
  const previousByUrl = new Map(
    (Array.isArray(previousSnapshots) ? previousSnapshots : [])
      .map((snapshot) => [snapshot.source_url, snapshot])
  );
  const snapshots = [];
  const observations = [];

  for (const page of Array.isArray(pages) ? pages : []) {
    const rawUrl = page?.metadata?.sourceURL || page?.metadata?.url;
    if (!isCompanyOwnedHttpsUrl(rawUrl, domain)) continue;
    const url = new URL(rawUrl);
    url.hash = "";
    url.search = "";
    const sourceUrl = url.toString();
    const content = normalizeContent(page?.markdown);
    if (content.length < MIN_CONTENT_LENGTH) continue;

    const currentTokenHashes = tokenHashes(content);
    const snapshot = {
      canonical_domain: domain,
      source_url: sourceUrl,
      content_hash: hash(content),
      token_hashes: currentTokenHashes,
      content_length: content.length,
      page_title: typeof page?.metadata?.title === "string"
        ? page.metadata.title.slice(0, 300)
        : null,
      fetched_at: fetchedAt,
    };
    snapshots.push(snapshot);

    const previous = previousByUrl.get(sourceUrl);
    if (!previous || previous.content_hash === snapshot.content_hash) continue;
    const ratio = changeRatio(previous.token_hashes, currentTokenHashes);
    if (ratio < MIN_CHANGE_RATIO) continue;
    const eventType = eventTypeForUrl(sourceUrl);
    observations.push({
      signal_type: "web_activity",
      event_type: eventType,
      title: titleForChange(eventType, snapshot.page_title),
      observed_at: fetchedAt,
      source_url: sourceUrl,
      evidence_text: `Material content delta ${Math.round(ratio * 100)}%`,
      confidence: ratio >= 0.3 ? 0.95 : 0.82,
      entity_match: "exact",
    });
  }

  return { snapshots, observations };
}
