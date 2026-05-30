# IntentIQ

B2B sales intelligence platform that scores companies by purchase intent using real-time signals and AI reasoning.

## What it does

IntentIQ aggregates 5 live signals per company (funding activity, hiring velocity, news mentions, tech stack, web presence), computes a weighted 0–100 intent score with freshness decay, and uses Claude to generate buying-stage analysis, talk tracks, and recommended next actions. It also scores individual people by seniority fit and career trajectory.

Score bands: **HOT** (≥75) · **WARM** (50–74) · **COLD** (<50)

## Tech stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL + RLS)
- **Cache / Rate limiting**: Upstash Redis
- **Billing**: Polar.sh
- **AI**: Anthropic Claude (reasoning, chat copilot, onboarding)
- **Signal APIs**: Explorium (funding), Apollo.io (people), GNews, BuiltWith, OpenPageRank, Apify
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

# Anthropic (falls back to mock summary if unset)
ANTHROPIC_API_KEY=

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
APIFY_API_KEY=

# Skip real API calls during development
MOCK_SIGNALS=true
```

Set `MOCK_SIGNALS=true` to use deterministic mock signals seeded by domain — no external API keys required for local dev.

### 3. Run

```bash
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## Architecture

### Scoring pipeline (`app/api/v1/score/route.ts`)

1. Validate API key (SHA-256 hashed against `api_keys` table)
2. Check user credits (`users` table)
3. Check Redis cache (24h TTL)
4. Fetch 5 signals in parallel
5. Compute weighted intent score (`lib/scorer.ts`)
6. Generate AI summary + recommended action (`lib/reasoning.ts`)
7. Cache result, persist to `scores` table, deduct 1 credit via `deduct_credit` RPC

### Signal weights

| Signal     | Weight |
|------------|--------|
| Funding    | 25%    |
| Hiring     | 20%    |
| News       | 20%    |
| Technology | 20%    |
| Web        | 15%    |

Score decays 15% per month from `latestSignalDate`. A sigmoid spread function pushes weak scores below 35 and strong scores above 70.

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
- `lib/reasoning.ts` — Anthropic SDK wrapper; falls back to mock if `ANTHROPIC_API_KEY` unset
- `lib/signals/mock.ts` — deterministic mock signals for dev
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

Accepts CSV of domains. Creates a `bulk_jobs` row (`queued → processing → completed/failed`). Max 1,000 companies per job, max 3 concurrent jobs per user. BullMQ worker wiring is a pending TODO.

### Chat copilot

Real-time chat with embedded score cards. Claude 3.5 Sonnet via Anthropic SDK. Conversation history persisted to `chat_sessions` / `chat_messages`. Costs 0.25 credits per message.

## Database migrations

Located in `supabase/migrations/`. Run via Supabase CLI:

```bash
supabase db push
```

Notable migrations:
- Auth migration to Clerk
- Business profile + ICP fit scoring
- Person scoring
- Autopilot workflows
- Polar.sh billing
- RLS hardening on autopilot and person_scores tables

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard. The Polar webhook endpoint (`/api/billing/webhook`) must be registered in the Polar dashboard with the correct signing secret.