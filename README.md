# VesperWise

B2B sales intelligence platform that scores companies by purchase intent using time-bound evidence and AI reasoning.

## What it does

VesperWise scores four purchase-intent triggers—funding, hiring, news, and technology changes—and keeps web authority and GitHub activity as supporting context. The versioned scoring model returns a 0–100 score, source coverage, freshness-adjusted contributions, and an AI-generated buying-stage analysis. A separate `icp_fit_score` measures fit against a verified workspace business profile without changing purchase intent.

Score bands: **HOT** (≥75) · **WARM** (50–74) · **COLD** (<50)

## Tech stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL + RLS)
- **Cache / Rate limiting**: Upstash Redis
- **Billing**: Polar.sh
- **AI**: OpenRouter (Gemini score reasoning; Claude chat copilot and onboarding)
- **Signal APIs**: Explorium (funding and hiring), GNews, BuiltWith, OpenPageRank, GitHub, Apollo.io (people)
- **Hiring fallback**: BullMQ + Scrapling crawler for promoted first-party careers evidence
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts, GSAP

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenRouter (bounded score reasoning; deterministic fallback if unset)
OPENROUTER_API_KEY=

# Upstash Redis (cache/rate-limit skipped if unset)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Polar.sh billing
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_STARTER=
POLAR_PRODUCT_GROWTH=
POLAR_PRODUCT_PRO=
POLAR_PRODUCT_AGENCY=
POLAR_PRODUCT_TOPUP_100=
POLAR_PRODUCT_TOPUP_500=
POLAR_PRODUCT_TOPUP_1000=

# Signal sources (only needed when MOCK_SIGNALS=false)
EXPLORIUM_API_KEY=
GNEWS_API_KEY=
BUILTWITH_API_KEY=
OPEN_PAGE_RANK_API_KEY=
GITHUB_TOKEN=

# Skip real API calls during development
MOCK_SIGNALS=true

# Core scoring rollout (default true). Set false for the saturated four-trigger rollback engine.
SCORING_V2_ENABLED=true

# Optional hiring refresh worker; requires a Redis TCP/TLS URL, not Upstash REST
BULLMQ_REDIS_URL=
SCRAPLING_SHADOW_MODE=true
SCRAPLING_PROMOTED_ADAPTERS=
SCRAPLING_BROWSER_ENABLED=false
SCRAPLING_JOB_TIMEOUT_MS=90000
# PYTHON_BIN=python3
```

Set `MOCK_SIGNALS=true` to use deterministic mock signals seeded by domain — no external API keys required for local dev.

### 3. Run

```bash
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
npm test         # Vitest, one run
npm run test:scoring-db # destructive only to an explicitly confirmed disposable Postgres database
npm run test:watch
```

## Architecture

### Scoring pipeline (`app/api/v1/score/route.ts`)

1. Authenticate the Clerk session or SHA-256-hashed API key and canonicalize the company domain.
2. Check the personalized result cache, isolated by workspace, domain, business-profile hash, and scoring version. Successful results live for 6 hours and cache hits are free.
3. Start an idempotent database-backed score run and reserve one credit. Concurrent duplicates share the same run.
4. Reuse fresh source evidence for 6 hours, otherwise refresh sources in parallel. Last-known-good evidence is retained for up to 7 days and marked stale when a refresh fails.
5. Score the four intent triggers and calculate explicit data coverage; web and GitHub remain context-only.
6. Reject results below minimum coverage, or generate AI reasoning and a separate ICP-fit score for scoreable results.
7. Atomically persist the evidence, score history, replayable result, and one credit debit. Failed and unscorable runs return the reserved credit.
8. Cache the personalized result for 6 hours and run eligible automations after persistence succeeds.

### Signal weights

| Source | Base weight | Composite role |
|--------|------------:|----------------|
| Funding | 22 | Scored trigger |
| Hiring | 19 | Scored trigger |
| News | 18 | Scored trigger |
| Technology | 18 | Scored trigger |
| Web | — | Context only |
| GitHub | — | Context only |

The four trigger weights total 77. Each source score is normalized to 0–100, then decayed from its own verified `observed_at` timestamp:

```text
normalized_i = 100 × clamp(source_score_i / source_max_i, 0, 1)
freshness_i  = 0.85 ^ (max(age_days_i, 0) / 30)
coverage     = Σ(base_weight_i × status_factor_i) / 77
intent_score = round(Σ(effective_weight_i × normalized_i × freshness_i)
                     / Σ(effective_weight_i))
```

Coverage factors are `1` for `ok` and verified `no_signal`, `0.5` for `stale`, and `0` for `not_found` or `unavailable`. The effective weight is the base weight multiplied by that factor. Verified `no_signal` contributes zero score with full coverage.

| Coverage | `score_status` | Result |
|----------|----------------|--------|
| `1.0` | `complete` | Full score; eligible for automation after the baseline run |
| `0.6` to `<1.0` | `partial` | Score returned with reduced source coverage |
| `<0.6` | `unscorable` | Null score and band; no credit charged |

There is no sigmoid or cross-signal boost. The freshness curve retains 85% of a trigger after 30 days, and the response exposes the calculation in `contributions`. Score bands remain **HOT** (≥75), **WARM** (50–74), and **COLD** (<50).

### Score API

`POST /api/v1/score` is the canonical interface. Supply a domain and optionally the display name; use `Idempotency-Key` when a client may retry the same request.

```bash
curl -X POST http://localhost:3000/api/v1/score \
  -H "Authorization: Bearer $VESPERWISE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: score-acme-2026-07-15" \
  -d '{"domain":"acme.com","company":"Acme"}'
```

`GET /api/v1/score?domain=acme.com&company=Acme` remains available as a compatibility wrapper. New integrations should use `POST`. Reusing an idempotency key with the same request replays its terminal result; reusing it for different input is rejected.

Important response fields include `scoring_version`, `score_status`, `data_coverage`, `contributions`, `source_status`, `cached`, and `charged`. Each structured evidence item exposes `source`, `fetched_at`, `observed_at`, and a `source_url` when the provider supplies one. `icp_fit_score` is returned separately when the workspace has a verified business profile; it is never blended into `intent_score`.

### Route groups

| Group | Path | Purpose |
|-------|------|---------|
| `(auth)` | `/login`, `/signup` | Unauthenticated layout |
| `(dashboard)` | `/score`, `/people`, `/bulk`, `/watchlist`, `/pipeline`, `/history`, `/autopilot`, `/settings`, `/billing`, `/api-keys` | Authenticated layout |
| `api/v1/` | `/score`, `/score/bulk`, `/score/person`, `/watchlist`, `/prioritize` | Public REST API |
| `api/billing/` | `/checkout`, `/topup`, `/webhook` | Polar.sh integration |
| `api/user/` | `/keys` | API key management |

### Key modules

- `lib/types.ts` — shared types, `PLAN_CREDITS`, `PLAN_WATCHLIST_LIMIT`, `PLAN_RATE_LIMIT`
- `lib/supabase.ts` — `createSupabaseServerClient()` (cookie-based) and `createSupabaseAdmin()` (service role)
- `lib/redis.ts` — Upstash wrapper; no-ops if env vars not set
- `lib/score-service.ts` — evidence reuse, personalized caching, idempotent runs, persistence, and charging
- `lib/scorer.ts` — versioned linear intent model, freshness, coverage, and bands
- `lib/reasoning.ts` — one bounded, schema-validated OpenRouter request with a deterministic fallback
- `lib/signals/mock.ts` — deterministic mock signals for dev
- `lib/hiring-refresh-queue.ts` — best-effort BullMQ producer for first-party hiring refreshes
- `proxy.ts` — Next.js 16 middleware (named export `proxy`); refreshes Clerk session, redirects unauthenticated users from dashboard paths

### Billing

Plans: `free` · `starter` · `growth` · `pro` · `agency`

Credits reset on subscription change (Polar webhook `subscription.created` / `subscription.updated`). One-time top-ups increment credits without changing plan (`order.paid`). Bulk jobs deduct credits equal to the company count upfront.

| Plan    | Credits/mo |
|---------|-----------|
| Free    | 20        |
| Starter | 500       |
| Growth  | 2,500     |
| Pro     | 8,000     |
| Agency  | 25,000    |

### Autopilot

Workflow engine with conditional triggers (score thresholds, band changes, signal spikes) and actions (email drafts, webhooks, Slack notifications, pipeline stage updates). Supports AND/OR condition logic, daily/weekly schedules, and full run history.

### Person scoring (`/people`)

Scores individuals by email, LinkedIn URL, or name. Signals: career trajectory (30 pts), seniority fit (20 pts), company intent (20 pts), news mentions (15 pts), social presence (15 pts). Enriched via Apollo.io with PDL as fallback.

### Bulk scoring

The dashboard CSV flow scores up to 50 companies inline and relies on the same per-company cache and atomic charging behavior. The public queued bulk endpoint accepts up to 1,000 companies and allows three concurrent `bulk_jobs`; it still requires a separate bulk processor. The hiring-refresh worker below does not process bulk scoring jobs.

### Hiring refresh worker (Scrapling Phase 2)

When Explorium hiring evidence is `unavailable`, `not_found`, or `stale`, the web app can enqueue a deduplicated `hiring-refresh` job. The worker crawls only the company's HTTPS careers pages and approved Greenhouse, Lever, Ashby, or Workable tenants, then stores `hiring-v2` evidence in `signal_evidence`.

Scrapling evidence is written in shadow mode by default. Only evidence deliberately promoted with `shadow=false` can affect scoring, and it is used as a fallback—never added to fresh Explorium hiring evidence. See [`workers/hiring-refresh/README.md`](workers/hiring-refresh/README.md) for deployment, safety constraints, and test commands.

The worker requires `BULLMQ_REDIS_URL` with a Redis TCP/TLS connection. `UPSTASH_REDIS_REST_URL` is used by the web app cache and is not BullMQ-compatible.

### Chat copilot

Real-time chat with embedded score cards. Claude is routed through OpenRouter. Conversation history is persisted to `chat_sessions` / `chat_messages`. Chats cost 0.25 credits per message.

## Database migrations

Located in `supabase/migrations/`. Run via Supabase CLI:

```bash
supabase db push
```

Before deploying scoring v2, apply the migration to a disposable Postgres
database and exercise the real transactional RPCs. The integration suite
refuses ordinary database names and requires the reset confirmation to exactly
match the disposable database name:

```bash
SCORING_V2_TEST_DATABASE_URL=postgres://localhost/scoring_v2_test \
SCORING_V2_TEST_ALLOW_RESET=scoring_v2_test \
npm run test:scoring-db
```

The suite resets that database's `public` schema, then verifies concurrent
last-credit reservations, cross-user/profile cache isolation, idempotent replay,
persistence-failure refunds, and stale-run recovery against the migration itself.

Enable the Supabase Cron Postgres module before applying the production
migration. The migration then installs the named `scoring-v2-stale-run-reaper`
job every five minutes; it refunds reservations left `running` for more than 15
minutes. If Cron is intentionally disabled, invoke
`reap_stale_score_runs(100)` from a service-role scheduler at the same cadence.

Notable migrations:
- Auth migration to Clerk
- Business profile + ICP fit scoring
- Scoring v2 evidence, idempotent score runs, coverage metadata, and atomic credit lifecycle
- Person scoring
- Autopilot workflows
- Polar.sh billing
- RLS hardening on autopilot and person_scores tables

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard. The Polar webhook endpoint (`/api/billing/webhook`) must be registered in the Polar dashboard with the correct signing secret.
