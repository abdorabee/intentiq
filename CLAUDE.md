# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Environment Variables

Create a `.env.local` file with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (optional in dev — falls back to mock AI summary)
ANTHROPIC_API_KEY=

# Upstash Redis (optional — cache is skipped if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Dev mode — use mock signals instead of real API calls
MOCK_SIGNALS=true
```

Set `MOCK_SIGNALS=true` to skip all external signal API calls during development.

## Architecture Overview

**IntentIQ** is a B2B sales intelligence platform that scores companies by purchase intent. It is a Next.js 16 App Router application.

### Core Scoring Pipeline (`app/api/v1/score/route.ts`)

1. Validate API key against `api_keys` table (SHA-256 hashed)
2. Check user credits in `users` table
3. Check Redis cache (24h TTL via Upstash)
4. Fetch 5 signals in parallel: funding, hiring, news, technology, web
5. Compute weighted intent score 0–100 via `lib/scorer.ts`
6. Generate AI summary + recommended action via `lib/reasoning.ts` (Claude API)
7. Cache result + persist to `scores` table + deduct 1 credit via `deduct_credit` RPC

### Signal Weights (`lib/scorer.ts`)

| Signal     | Weight |
|------------|--------|
| funding    | 25%    |
| hiring     | 20%    |
| news       | 20%    |
| technology | 20%    |
| web        | 15%    |

Score decays 15% per month from `latestSignalDate`. Bands: HOT ≥75, WARM ≥50, COLD <50.

### Key Libraries

- `lib/types.ts` — all shared types and plan constants (`PLAN_CREDITS`, `PLAN_WATCHLIST_LIMIT`, `PLAN_RATE_LIMIT`)
- `lib/supabase.ts` — two clients: `createSupabaseServerClient()` (cookie-based, for Server Components) and `createSupabaseAdmin()` (service role, bypasses RLS, for API routes)
- `lib/redis.ts` — Upstash Redis wrapper; all cache operations are no-ops if `UPSTASH_REDIS_REST_URL` is not set
- `lib/reasoning.ts` — Anthropic SDK wrapper; falls back to a mock summary if `ANTHROPIC_API_KEY` is not set
- `lib/signals/mock.ts` — deterministic mock signals seeded by domain string (used when `MOCK_SIGNALS=true`)

### Route Groups

- `app/(auth)/` — login, signup pages (unauthenticated layout)
- `app/(dashboard)/` — dashboard, score, watchlist, bulk, api-keys, billing pages (authenticated layout)
- `app/api/v1/` — public REST API (score single, bulk score, watchlist, prioritize)
- `app/api/billing/` — Stripe checkout, top-up, and webhook handler
- `app/api/user/` — API key management

### Auth & Middleware

`proxy.ts` exports the middleware function (named `proxy`, not `middleware`) that refreshes Supabase session cookies and redirects unauthenticated users away from dashboard paths. The middleware matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and all `/api/` paths.

### Billing Model

Plans: `free | starter | growth | pro | agency`. Credits are reset on subscription change (via Stripe webhook `customer.subscription.updated/created`). One-time top-ups increment credits without changing plan. Credits are deducted per score request via a Supabase RPC `deduct_credit`. Bulk jobs deduct credits equal to the company count upfront.

### Bulk Jobs

`app/api/v1/score/bulk/route.ts` creates a `bulk_jobs` row with status `queued`. The actual BullMQ worker processing is not yet wired up (marked as TODO). Max 1,000 companies per job, max 3 concurrent jobs per user.

### UI Components

`components/ui/` — shadcn/ui components. `components/dashboard/` — dashboard nav and quick-score widget. `components/landing.tsx` — marketing landing page.
