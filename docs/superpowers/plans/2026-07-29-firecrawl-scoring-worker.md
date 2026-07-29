# Firecrawl Scoring Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate and verify the existing Firecrawl scoring worker through a shadow-first Railway rollout.

**Architecture:** Scoring remains synchronous over persisted evidence while Firecrawl runs asynchronously through BullMQ. Shadow evidence is promoted one signal at a time only after the approved accuracy and safety gates pass.

**Tech Stack:** Next.js 16, Node.js 22, BullMQ, Supabase, Firecrawl v2, Railway, Vitest

## Global Constraints

- Preserve unrelated bulk-workspace edits in the source checkout.
- Do not expose Firecrawl, Redis, or Supabase service-role credentials.
- Keep `SCORING_V3_ENABLED=false` until a separate production promotion decision.
- Never combine provider and Firecrawl evidence for the same signal.
- Never convert unavailable crawler coverage into zero intent.

---

### Task 1: Isolate and verify the baseline

- [ ] Create a clean worktree from `scoring-improvement` commit `1f42f0d`.
- [ ] Install locked dependencies and run `npm test`.
- [ ] Confirm no source-checkout changes entered the worktree.

### Task 2: Close provider failure and deployment gaps

- [ ] Add failing tests for permanent versus transient Firecrawl API failures.
- [ ] Make permanent `4xx` failures unrecoverable and retain retries for rate limits, timeouts, and server failures.
- [ ] Add a service-specific Railway config and secret-safe environment template.
- [ ] Add an operational runbook covering smoke tests, quality gates, promotion, and rollback.
- [ ] Run `npm run test:web-enrichment`.

### Task 3: Verify remote prerequisites

- [ ] Verify the scoring-v3 Supabase objects and apply the migration only if absent.
- [ ] Confirm Railway project authentication and the Firecrawl secret before deployment.
- [ ] Deploy the dedicated worker with shadow settings if both are available.

### Task 4: Acceptance and handoff

- [ ] Run the complete test suite, TypeScript check, targeted lint, production build, and Docker build.
- [ ] Run normal, quiet, and failing live domains when provider credentials are available.
- [ ] Record which local, database, provider, and deployment checks were actually verified.
