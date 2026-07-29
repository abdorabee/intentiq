# Firecrawl shadow rollout

This runbook activates the existing Firecrawl v2 enrichment worker without
changing customer-visible scoring. Firecrawl is a queued evidence provider,
not an MCP dependency and not a synchronous dependency of `/api/v1/score`.

## Preconditions

- Deploy from a clean commit containing `20260727000000_scoring_v3.sql`.
- Confirm the linked Supabase environment exposes:
  `scoring_policies`, `score_shadow_results`, `web_enrichment_maps`,
  `web_page_snapshots`, `web_enrichment_runs`, and `score_outcomes`.
- Use a Redis TCP/TLS URL for `BULLMQ_REDIS_URL`; Upstash REST is not
  BullMQ-compatible.
- Create a Firecrawl API key and store it only in Railway.
- Keep the production web application on:

```env
SCORING_V3_SHADOW_ENABLED=true
SCORING_V3_ENABLED=false
WEB_ENRICHMENT_FUNDING_FALLBACK=false
```

## Create the Railway worker

1. Create a persistent Railway service from the VesperWise GitHub repository.
2. Set its Config File Path to `/workers/web-enrichment/railway.json`.
3. Add the variables from `workers/web-enrichment/env.example`; populate only
   the four secret values and retain the checked-in shadow defaults.
4. Do not generate a public domain. This worker consumes BullMQ and exposes no
   HTTP service.
5. Deploy and confirm the process stays active without missing-environment or
   Redis connection errors.

The Docker image runs as a non-root user. Railway builds
`workers/web-enrichment/Dockerfile`, and the worker starts through the
Dockerfile `CMD`.

## Smoke verification

Enqueue three domains through the normal score flow:

- A normal first-party site with public news, careers, or product pages.
- A quiet site with no qualifying dated event.
- A blocked, unavailable, or deliberately invalid test domain.

For the normal site, confirm one completed `web_enrichment_runs` row, a cached
map, page snapshots, and shadow `signal_evidence` rows. For the quiet site,
confirm the result is `unavailable`, not `no_signal`. For the failing site,
confirm the score request completes independently and the worker records a
bounded failure.

Provider responses have the following retry contract:

- `408`, `409`, `425`, `429`, and `5xx`: retry through BullMQ.
- Other `4xx`, including insufficient credits and invalid authorization:
  unrecoverable until configuration or account state changes.
- Network timeouts: retry through BullMQ.

## Shadow cohort and quality gate

Review at least 100 representative companies across supported site types.
Measure each signal separately and retain source URLs for every reviewed
observation.

| Signal gate | Required |
| --- | ---: |
| Exact company/entity precision | at least 98% |
| Extracted-field accuracy | at least 95% |
| Supported-page success | at least 90% |
| Access-policy, robots, or SSRF violations | 0 |

Also review:

- Page and estimated provider-credit totals against the 1,500-page daily cap.
- P50/P95 job duration, attempts, and failure reasons.
- V2 production versus V3 shadow score and band changes.
- First snapshots produce no `web_activity`.
- Provider and Firecrawl evidence are never added together for one signal.

Do not interpret an incomplete crawl as evidence of zero intent.

## Promotion and rollback

Promote only one signal at a time in this order:

1. `news`
2. `hiring`
3. `technology`
4. `web_activity`

For the selected signal, set:

```env
WEB_ENRICHMENT_SHADOW_MODE=false
WEB_ENRICHMENT_PROMOTED_SIGNALS=news
```

Replace `news` only after the next signal passes its own quality gate. Funding
remains excluded unless the structured provider is missing or stale and
`WEB_ENRICHMENT_FUNDING_FALLBACK=true` is approved separately.

Customer-visible V3 requires a separate promotion decision. Until then keep
`SCORING_V3_ENABLED=false`.

Rollback requires no database reversal:

```env
WEB_ENRICHMENT_SHADOW_MODE=true
WEB_ENRICHMENT_PROMOTED_SIGNALS=
SCORING_V3_ENABLED=false
```

Redeploy the affected Railway and web services, then confirm new Firecrawl
evidence is shadowed and active scoring reports the V2 scoring version.
