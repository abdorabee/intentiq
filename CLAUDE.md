# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

Vitest is configured — `npm test` runs the suite once, `npm run test:watch` watches, `npm run test:scoring-db` runs a destructive integration suite that resets a Postgres database (only run it against an explicitly confirmed disposable database — see README "Database migrations"). There is no `vitest.config.*`; defaults apply. Tests are colocated as `*.test.ts(x)`. No jsdom environment is configured, so component tests use `renderToStaticMarkup` rather than a DOM-testing library (see `components/dashboard/nav.test.ts`, `components/bulk/bulk-workspace.test.tsx`).

## Environment Variables

Create a `.env.local` file. See [README.md](README.md) for the full, current template — it covers Supabase, Clerk, OpenRouter, Upstash Redis, Polar.sh, signal source APIs, and both worker configs (BullMQ hiring-refresh, Firecrawl web-enrichment). Two things worth calling out explicitly:

- **Auth is Clerk**, not Supabase Auth — you need `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- **AI reasoning goes through OpenRouter** (`OPENROUTER_API_KEY`) for both score summaries (Gemini) and the chat copilot/onboarding (Claude) — not a direct `ANTHROPIC_API_KEY` call, even though `@anthropic-ai/sdk` is a dependency.

Set `MOCK_SIGNALS=true` to skip all external signal API calls during development.

## Architecture Overview

**VesperWise** is a B2B sales intelligence platform that scores companies by purchase intent. It is a Next.js 16 App Router application.

### Core Scoring Pipeline (`app/api/v1/score/route.ts`)

1. Authenticate the Clerk session or a SHA-256-hashed API key; canonicalize the domain.
2. Check the personalized result cache (workspace + domain + business-profile hash + scoring version).
3. Start an idempotent database-backed score run and reserve one credit.
4. Reuse fresh source evidence (6h) or refresh the four scored signals in parallel.
5. Compute the weighted intent score via `lib/scorer.ts` and calculate coverage.
6. Generate AI reasoning (OpenRouter) and a separate `icp_fit_score` for scoreable results.
7. Persist evidence, score history, and the credit debit atomically; cache the result.

Full step-by-step detail and response field reference: see [README.md](README.md) "Scoring pipeline" and "Score API".

### Signal Weights (`lib/scorer.ts`)

| Signal     | Weight | Role |
|------------|-------:|------|
| funding    | 22     | Scored trigger |
| hiring     | 19     | Scored trigger |
| news       | 18     | Scored trigger |
| technology | 18     | Scored trigger |
| web        | —      | Context only, not scored |
| GitHub     | —      | Context only, not scored |

The four trigger weights total 77. Each source is decayed from its own verified `observed_at` timestamp: `freshness = 0.85 ^ (age_days / 30)` (i.e. it retains 85% of a trigger's contribution every 30 days — not a flat 15%/month deduction). Coverage factors are `1` for `ok`/verified `no_signal`, `0.5` for `stale`, `0` for `not_found`/`unavailable`; `score_status` is `complete` at coverage `1.0`, `partial` at `0.6`–`<1.0`, `unscorable` below `0.6`. Bands: HOT ≥75, WARM ≥50, COLD <50. See README "Signal weights" for the full formula.

### Key Libraries

- `lib/types.ts` — all shared types and plan constants (`PLAN_CREDITS`, `PLAN_WATCHLIST_LIMIT`, `PLAN_RATE_LIMIT`, `PLAN_AUTOPILOT_LIMIT`)
- `lib/supabase.ts` — exports **only** `createSupabaseAdmin()` (service role, bypasses RLS). There is no `createSupabaseServerClient()` — Clerk owns the session, not Supabase Auth.
- `lib/billing-plans.ts` / `lib/billing-stats.ts` — plan definitions/pricing copy and billing-page data assembly
- `lib/redis.ts` — Upstash Redis wrapper; all cache operations are no-ops if `UPSTASH_REDIS_REST_URL` is not set
- `lib/reasoning.ts` — bounded, schema-validated OpenRouter request (Gemini for score summaries) with a deterministic fallback
- `lib/signals/mock.ts` — deterministic mock signals seeded by domain string (used when `MOCK_SIGNALS=true`)
- `lib/dashboard-search.ts` — the ⌘K command palette's page index

### Route Groups

- `app/(auth)/` — login, signup pages (unauthenticated layout)
- `app/(dashboard)/` — dashboard, analyze, score, people, watchlist, lists, pipeline, history, autopilot, inbox, bulk, memory (redirects to `/settings?tab=profile`), settings, billing, api-keys, onboarding (authenticated layout)
- Public marketing pages at the app root: `/`, `/about`, `/contact`, `/docs`, `/privacy`, `/terms`, `/legal/dpa`, `/legal/security`
- `app/api/v1/` — public REST API (score, score/bulk, score/bulk-inline, score/history, score/person, watchlist, prioritize)
- `app/api/billing/` — Polar.sh checkout, top-up, portal, and webhook handler
- `app/api/user/` — profile, api-keys, notifications, scoring-policy (self-serve account data)
- `app/api/autopilot/`, `app/api/dashboard/`, `app/api/chat/`, `app/api/inbox/` — engine and dashboard-internal routes

Full table: see README "Route groups".

### Settings route

`/settings` is a tabs page (`page.tsx` server component + `settings-view.tsx` client view + `components/settings/*`) covering **Profile & Account** (identity plus the ICP/business-profile editor that used to be the standalone `/memory` page), **API Keys** (shared `components/settings/api-keys-panel.tsx`, also mounted at the standalone `/api-keys` route), **Notifications** (preference toggles — stored only, no email sender wired yet), and **Billing** (a lightweight summary linking to the full `/billing` page).

### Auth & Middleware

Auth is **Clerk**. Server code calls `const { userId } = await auth()` from `@clerk/nextjs/server`; client code uses `useUser()` / `SignOutButton` from `@clerk/nextjs`. `proxy.ts` exports `proxy` (named export, not `middleware`), wrapping `clerkMiddleware`. A `createRouteMatcher` allowlist covers `/`, `/login(.*)`, `/signup(.*)`, `/docs(.*)`, `/terms(.*)`, `/privacy(.*)`, `/contact(.*)`, `/about(.*)`, `/legal/(.*)`, `/api/v1/(.*)`, `/api/billing/webhook`, `/api/contact` — **everything else is `auth.protect()`'d automatically**, including every dashboard page and every other `/api/*` route. The middleware `matcher` excludes only `_next/static`, `_next/image`, and `favicon.ico` — `/api/*` routes ARE matched (they're just individually allowlisted or protected, not globally excluded).

### Standard user-data pattern (`app/api/user/*`)

`const { userId } = await auth()` → 401 if absent → `createSupabaseAdmin()` → scope every query with `.eq("id", userId)` (`users` table) or `.eq("user_id", userId)` (owned rows like `api_keys`). There is **no RLS enforcement in effect** on these paths — the service-role client bypasses RLS entirely; ownership is enforced solely in application code. Canonical example: `app/api/user/profile/route.ts`.

### Billing Model

Plans: `free | starter | growth | pro | agency`. Credits are reset on subscription change (via Polar webhook `subscription.created`/`subscription.updated`). One-time top-ups increment credits without changing plan (via `order.paid` webhook). Credits are deducted per score request via atomic reserve/commit RPCs (see README "Database migrations"). Bulk jobs deduct credits equal to the company count upfront.

### Bulk Jobs

`app/api/v1/score/bulk/route.ts` creates a `bulk_jobs` row with status `queued` — it still has no processor wired up. `app/api/v1/score/bulk-inline/route.ts` (≤50 companies) is the one bulk path that actually scores synchronously today. The BullMQ **hiring-refresh** (`workers/hiring-refresh/`) and **web-enrichment** (`workers/web-enrichment/`) workers are built and shipped with their own READMEs, but neither processes `bulk_jobs` — they refresh per-company evidence, not bulk job queues.

### UI Components

`components/ui/` — shadcn/ui components (style "new-york", primitives imported from the unified `radix-ui` package rather than per-primitive `@radix-ui/*` packages). `components/dashboard/` — dashboard nav, topbar, and shell. `components/settings/` — the Settings page's tab components. `components/billing/` — the `/billing` page's component set. `components/landing/LandingPage.tsx` — the marketing page (most other files under `components/landing/` are unreferenced; treat them as dead unless confirmed otherwise).
