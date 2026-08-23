# Task 5 report: Clerk lifecycle integrity

## Scope

Task 4's signed Clerk lifecycle webhook, atomic lifecycle RPCs, database-backed
readiness gate, cascade guard, signature coverage, and account capability gate
were already present and were left unchanged. This task closes the remaining
provisioning and profile-row integrity gaps.

## Changes

- `ensureUserRecord` now fails when Clerk cannot supply the authenticated owner
  and a non-empty primary email, rather than creating a blank-email record.
- Provisioning now uses one ID-conflict upsert containing only Clerk-owned
  identity data (`id`, `email`). This safely handles concurrent first visits,
  reconciles an existing user's primary-email change, and preserves plan,
  credits, and onboarding state owned by VesperWise.
- Supabase provisioning errors now reject the dashboard request instead of being
  silently ignored.
- Profile reads distinguish storage failures (500) from a missing profile row
  (404), and verify the returned row belongs to the authenticated Clerk user.
- Profile writes request and verify the changed row. A zero-row update returns
  404 rather than a false `success: true`; a cross-owner result fails closed.
- The profile mutation still writes `business_profile`, its denormalized
  `product_category`, and `onboarding_completed: true`, preserving scoring's
  existing data contract.

## Test-first evidence

Added focused tests before production changes in:

- `lib/user-provisioning.test.ts`
- `app/api/user/profile/route.test.ts`

Recorded RED after the fixtures were made to mirror Clerk's real email shape:

```text
Test Files  2 failed (2)
Tests  7 failed | 8 passed (15)
```

The failures covered ignored Supabase provisioning errors, stale existing email,
missing Clerk user acceptance, missing profile rows reported as success, and
cross-owner result acceptance. The concurrent first-visit behavior was already
safe under the previous atomic conflict-ignore upsert and remains explicitly
covered by the new test.

Recorded GREEN:

```text
npm test -- lib/user-provisioning.test.ts app/api/user/profile/route.test.ts
Test Files  2 passed (2)
Tests  15 passed (15)
```

## Validation

```text
npm test -- lib/user-provisioning.test.ts app/api/user/profile/route.test.ts \
  app/api/webhooks/clerk/route.test.ts app/api/webhooks/clerk/route-signature.test.ts \
  lib/clerk-account-capability.test.ts app/api/user/preferences/route.test.ts \
  app/api/user/api-keys/route.test.ts
Test Files  7 passed (7)
Tests  45 passed (45)

npx eslint lib/user-provisioning.ts lib/user-provisioning.test.ts \
  app/api/user/profile/route.ts app/api/user/profile/route.test.ts
exit 0

npm test
Test Files  68 passed | 4 skipped (72)
Tests  364 passed | 20 skipped (384)

npm run build
exit 0

git diff --check
exit 0
```

The build retains the pre-existing Next.js informational warning that Edge
runtime disables static generation for one page; it does not fail the build.

## Concerns

None. Live Clerk/Supabase provider state was not changed or claimed as verified;
the evidence above is local source and build validation.
