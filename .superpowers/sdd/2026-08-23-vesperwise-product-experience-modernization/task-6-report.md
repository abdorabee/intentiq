# Task 6 report: activation-led onboarding and score corrections

## Scope

Replaced the profile-only onboarding flow with a three-stage activation flow,
made onboarding progress and completion server-authoritative, and corrected the
remaining Clerk identity, blank-domain, and watchlist-error behavior on
`/score`. Tour playback remains intentionally unimplemented.

## Changes

### Three-stage activation flow

- Combined offer, target industries, and ideal account size into stage one.
- Combined buyer, sales motion, deal size, and cycle into stage two.
- Added first-company scoring, optional watchlist save, and explicit skip in
  stage three.
- Provider, coverage/unscorable, credit, persistence, and completion failures
  retain the entered domain and expose Retry and Change domain. Skip for now is
  always available on stage three, including before the first scoring attempt.
- A successful score remains on the activation confirmation screen so the user
  can optionally add the account to the watchlist before entering the dashboard.

### Durable server state

- Expanded the reducer to three bounded steps with `unsaved`, `saving`, `saved`,
  and `error` states. Field and step changes are both dirty revisions.
- Added debounced progress writes to `PATCH /api/onboarding/progress`.
- The endpoint accepts a strict draft shape plus a positive monotonic revision,
  enforces legal step progression, and invokes a Clerk-scoped database function.
  Its `INSERT ... ON CONFLICT DO UPDATE ... WHERE stored_revision < incoming_revision`
  contract atomically rejects stale writes before they can overwrite newer
  durable state. A rejected request returns the verified newer server state.
- Onboarding boot reads the current preference draft/step and derives activation
  from the authenticated user's persisted scores and active watchlist rows.
  Refresh and a later login therefore resume from server state.
- Stage two saves the complete existing `business_profile` contract first, then
  persists stage three. The profile endpoint no longer sets onboarding complete.

### Authoritative completion

- Added `POST /api/onboarding/complete` with strict `activation | skip` reasons.
- Activation completion requires a complete persisted business profile plus a
  persisted scorable `scores` row or active watchlist row for the Clerk user.
  Client score payloads are never accepted as completion evidence.
- Explicit skip still requires the complete persisted business profile.
- Completion updates `onboarding_completed`, `onboarding_completed_at`, and
  `onboarding_completed_version` in one user-row mutation guarded by
  `onboarding_completed = false`.
- Zero-row updates are reselected to handle a concurrent winner; incomplete,
  missing, or cross-owner rows fail closed. Existing completed onboarding is
  returned idempotently without replaying the mutation.
- Score and watchlist activation evidence select both `id` and `user_id`; storage
  errors, malformed rows, and evidence owned by another user fail closed.
- Added migration `20260823181538_onboarding_completion_version.sql`, including
  a nonnegative version constraint, a completion-tuple invariant, legacy state
  normalization, the progress revision, and the service-role-only monotonic RPC.
- Onboarding and dashboard routing now use the same boolean/timestamp/version
  tuple. Owner mismatch, missing rows, storage errors, and inconsistent tuples
  produce an error rather than replaying onboarding or admitting a dashboard.

### Score corrections

- `/score` now reads the Clerk user ID instead of Supabase Auth identity when
  loading credits and recent history.
- Blank domain submission now displays a visible error without a request.
- Score/re-score controls are semantic buttons and domain inputs have accessible
  labels.
- Watchlist API failures are displayed instead of silently swallowed.

## Test-first evidence

Production behavior was introduced only after focused RED runs:

- Reducer RED: five failures for three-stage validation, resumed step bounds,
  authoritative save states, and later one failure proving navigation did not
  mark the resumed step unsaved.
- Profile RED: the owner-scoped write still included
  `onboarding_completed: true`.
- Progress API RED: the Clerk-scoped route did not exist.
- Completion API RED: the completion route did not exist; a later regression
  RED reproduced a null-row crash after a zero-row completion update.
- Wizard RED: five integration failures for four-stage rendering, missing
  autosave status, absent activation, and absent recovery/watchlist errors.
- Onboarding-page RED: two failures for missing preference resume and derived
  activation props.
- Score-page RED: Supabase Auth was called instead of Clerk.
- Score-view RED: blank submission had no accessible action/error and watchlist
  failure was silent.
- Migration RED: two failures because the completion-version migration did not
  exist.
- Review fix RED: 13 focused failures covered missing atomic revision writes,
  stale durable-state adoption, evidence owner mismatch, bootstrap missing/error
  states, inconsistent completion tuples, and direct skip. A follow-up RED added
  two tuple-routing failures before the shared routing helper existed.

Focused GREEN:

```text
npx vitest run <10 Task 6 focused files>
Test Files  10 passed (10)
Tests  59 passed (59)
```

The completion route now contains twelve focused cases, including authentication,
no activation evidence, score evidence, skip/profile gating, idempotency,
concurrent completion, zero changed rows, disappearing rows, and cross-owner
storage/evidence results and storage errors.

## Validation

```text
npx vitest run <10 Task 6 focused files>
Test Files  10 passed (10)
Tests  59 passed (59)

env ONBOARDING_DB_TESTS=true \
  ONBOARDING_TEST_DATABASE_URL=postgresql://laflame@127.0.0.1:55439/onboarding_test \
  ONBOARDING_TEST_ALLOW_RESET=onboarding_test \
  npx vitest run supabase/migrations/onboarding-completion-postgres.integration.test.ts
Test Files  1 passed (1)
Tests  4 passed (4)

npx eslint <Task 6 changed TypeScript and TSX files>
exit 0

npm test
Test Files  76 passed | 5 skipped (81)
Tests  402 passed | 24 skipped (426)

npm run build
compiled successfully; TypeScript passed; 73 routes generated

git diff --check
exit 0
```

The production build retains the repository's existing informational warning
that an Edge-runtime page cannot be statically generated.

## Concerns

- The migration is committed source only. No linked/local Supabase stack or
  remote project was changed. `supabase migration list --local` could not
  connect because the repository's local Supabase database was not running;
  migration SQL was instead verified in an isolated temporary Postgres cluster.
- A standalone `npx tsc --noEmit` remains noisy from pre-existing stale
  `.next/dev` route declarations and the existing
  `components/settings/product-experience-settings.test.tsx` mock tuple typing.
  The fresh `next build` TypeScript phase passed.
