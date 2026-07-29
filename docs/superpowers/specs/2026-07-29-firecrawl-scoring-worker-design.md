# Firecrawl Scoring Worker Design

## Goal

Activate Firecrawl as an asynchronous, auditable source of fresh company-web
evidence without making it a synchronous dependency of scoring or changing
customer-visible scores before evidence quality is proven.

## Architecture

`/api/v1/score` reads persisted evidence and calculates the current score
before best-effort enqueueing a deduplicated BullMQ job. A dedicated Railway
worker maps the company-owned HTTPS site, selects at most five relevant pages,
uses Firecrawl v2 Batch Scrape for structured extraction, validates exact
entity matches and dated evidence, and persists shadow `signal_evidence`.

Provider and crawler evidence are alternatives, never additive inputs for the
same signal. Missing or incomplete coverage is `unavailable`, not zero intent.
A first page snapshot establishes a baseline; only a later material change can
produce `web_activity`.

## Rollout

Keep V2 customer-visible and V3 shadowed. Review at least 100 representative
companies, requiring 98% entity precision, 95% field accuracy, 90%
supported-page success, and zero access-policy or SSRF violations per signal.
Promote `news`, `hiring`, `technology`, and then `web_activity`, one at a time.
Funding remains a separately approved structured-provider fallback.

## Operations

Run the non-root Docker worker on Railway with a Redis TCP/TLS connection,
Supabase service credentials, and a Firecrawl API key stored as secrets.
Retain the five-page job cap, six-hour deduplication, seven-day map reuse,
one-job concurrency, and 1,500-page daily budget. Rollback is configuration
only: restore shadow mode, clear the promoted-signal allowlist, and keep V3
disabled.
