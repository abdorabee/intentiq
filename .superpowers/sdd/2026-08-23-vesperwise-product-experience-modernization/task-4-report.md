# Task 4 report: Functional Settings product

## Status

Implemented and locally verified on top of Task 3 commit `d2e3689`. No Supabase migration, provider configuration, remote deployment, or production data was changed.

## Product structure

- Extended the recursive `NAVIGATION_MANIFEST` in `lib/dashboard-search.ts`; no parallel Settings registry was introduced.
- Added visible Settings destinations for Account & security, Business profile, Appearance, Developer, Data & privacy, and the existing Polar-backed Billing workspace.
- Registered `/settings/product-experience` as the canonical seam but kept it `later` and out of cards/search/secondary navigation while the real Task 7 tour engine is dormant.
- Added a responsive horizontal-to-vertical secondary navigation, shared Settings page headers, a route loading skeleton, and a retryable error boundary.
- Permanently redirects the legacy `/api-keys` route to `/settings/developer`.

## Account and security

- Delegates name, email addresses, avatar, password, MFA, and session management to Clerk's current `<UserProfile />` surface using hash routing.
- Hides Clerk's `dangerSection` and explicitly states that account deletion remains unavailable until Task 5 verifies the signed webhook and product-data cascade.
- Does not persist duplicate identity fields in Supabase or `user_preferences`.

## Appearance and preferences

- Appearance consumes the existing `ThemeProvider` authority for System/Light/Dark and the existing `DashboardShell` authority for expanded/collapsed desktop navigation.
- `DashboardShell` now exposes its existing state/writer through a narrow context; it does not add another storage path.
- Extended the existing last-write-wins coordinator with save status callbacks so Appearance can show saving/error feedback while Task 3 rollback behavior restores the last server-confirmed value.
- `user_preferences` remains the only durable preference authority; `intentiq-theme` and `nav-collapsed` remain pre-paint mirrors only.

## Data, privacy, and analytics

- Removed global unconditional GA loading from the public root layout.
- Authenticated layout now initializes GA only from the verified persisted `analytics_enabled` preference.
- Data & privacy updates that same preference optimistically, rolls back on failure, and only notifies the runtime loader after persistence succeeds.
- Added direct links to Privacy, Terms, Security, and DPA pages.
- Corrected runtime/legal claims across Privacy, Terms, Security, and Contact:
  - Google Analytics replaces the false self-hosted PostHog claim.
  - Actual local mirror keys are `intentiq-theme` and `nav-collapsed`; GA uses `_ga` / `_ga_*` only after consent.
  - OpenRouter is the AI gateway; unsupported Anthropic zero-retention, BYO key, workspace-disable, and Settings → AI claims were removed.
  - One-click deletion and in-product export claims were removed; verified privacy requests are described accurately.

## Developer and API keys

- Added strict 1–48 character labels, UUID revoke IDs, current-plan active-key limits, and browser-safe record projection.
- Every service-role query is scoped to the authenticated Clerk user ID.
- GET checks storage/plan errors and verifies every returned owner row before projection.
- POST checks the owner plan and active-key limit, stores only SHA-256 key material, verifies the created owner row, and returns the raw secret once.
- DELETE requires a valid ID, explicit UI confirmation, active owner scoping, a returned changed row, and verification that the row is now inactive; zero-row mutations return 404 rather than false success.
- Added loading, retry, validation, limit, copy-once, manual-copy fallback, confirmation, mutation loading, and error states.
- Billing and API reference links use the existing `/billing` and `/docs` product routes.

## Business profile

- Preserved the existing `users.business_profile` contract and `/api/user/profile` boundary.
- Added load failure/retry, complete-profile client validation, explicit save errors, and creation from an empty profile when no row value exists.
- Preserves persisted custom values and lets users add custom values to every field, including multi-select target industries.
- Adds `beforeunload` protection and same-origin link interception with an explicit discard confirmation for unsaved edits.
- Task 5 still owns zero-row hardening in the profile mutation route; this task did not take over that seam.

## Product experience

- The canonical route reads only the real persisted `tour_version`, `tour_status`, and `tour_step` fields.
- Version 0 renders an accurate unavailable state and no restart/no-op controls.
- The route is intentionally hidden from manifest discovery until Task 7 implements and activates the real tour engine.

## RED evidence

1. Settings manifest/routes, API keys, and GA gate:
   - Command: `npm test -- lib/dashboard-search.test.ts 'app/(dashboard)/settings/settings-routes.test.ts' lib/api-keys.test.ts app/api/user/api-keys/route.test.ts components/google-analytics.test.tsx`
   - Result: 5 files failed; 18 expected failures and 5 existing passes. Missing routes/contracts, placeholder manifest entries, unconditional GA, permissive labels, no plan limit, secret metadata exposure, and false-success revoke behavior were observed.
2. Settings components and Business profile:
   - Command: `npm test -- components/settings/appearance-settings.test.tsx components/settings/data-privacy-settings.test.tsx components/settings/api-keys-manager.test.tsx 'app/(dashboard)/settings/business-profile/business-profile-page.test.tsx'`
   - Result: 4 files failed. Three production components did not exist; Business profile lacked custom values and retry UI.
3. Same-origin unsaved navigation protection:
   - Command: `npm test -- 'app/(dashboard)/settings/business-profile/business-profile-page.test.tsx'`
   - Result: 1 expected failure; the internal link was not intercepted and the discard confirmation was never called.
4. Appearance persistence feedback:
   - Command: `npm test -- components/settings/appearance-settings.test.tsx`
   - Result: 1 expected failure; rollback existed but the Settings UI exposed no accessible save error.

## GREEN and verification evidence

- Focused Task 4 suite:
  - `npm test -- lib/dashboard-search.test.ts 'app/(dashboard)/settings/settings-routes.test.ts' lib/api-keys.test.ts app/api/user/api-keys/route.test.ts components/google-analytics.test.tsx components/settings/appearance-settings.test.tsx components/settings/data-privacy-settings.test.tsx components/settings/api-keys-manager.test.tsx 'app/(dashboard)/settings/business-profile/business-profile-page.test.tsx'`
  - 9 files passed; 33 tests passed at the first full Task 4 GREEN gate. Additional unsaved-navigation and appearance-feedback tests were then added and passed directly.
- Preference regression suite:
  - `npm test -- components/settings/appearance-settings.test.tsx components/theme-provider.test.tsx components/dashboard/nav.test.tsx lib/user-preferences.test.ts`
  - 4 files passed; 32 tests passed.
- Full Vitest suite, final:
  - `npm test`
  - 59 files passed, 3 skipped; 315 tests passed, 12 skipped.
- Changed-file lint and diff:
  - Focused `npx eslint ...` over every Task 4 TypeScript/TSX file, plus the modified Task 3 preference/theme/shell seams, exited 0 with no output.
  - `git diff --check` exited 0 with no output.
- Production build, final:
  - `npm run build`
  - Compiled successfully, Next TypeScript passed, 70 pages generated, and all six `/settings/*` subroutes plus `/api/user/api-keys` were registered.

## Self-review

- Confirmed no new preference registry/table/local authority exists.
- Confirmed Account uses Clerk, deletion is omitted, and no identity writes were added.
- Confirmed Product Experience is hidden and contains no fake tour control.
- Confirmed raw API secrets exist only in the immediate POST response and transient client state.
- Confirmed API key hashes and owner IDs never cross the browser projection.
- Confirmed every API-key query and mutation filters by the Clerk user ID and mutation success requires a verified returned row.
- Confirmed GA is absent from the public root and disabled authenticated preference path.
- Confirmed unsupported Anthropic/PostHog/BYO/AI-disable/one-click-delete claims are gone from product and legal copy; the remaining “Anthropic” example in Score is a sample company, not a provider claim.
- Confirmed Task 1–3 tests remain green and no unrelated files were reverted.

## Concerns and follow-up

- Plan-limit enforcement is a scoped count-before-insert check. It blocks ordinary over-limit creation but is not an atomic cross-instance database constraint; if concurrent key creation becomes an abuse path, add a transaction/RPC or database-enforced reservation in a separately migrated backend change.
- Clerk's embedded `UserProfile` is locally type/build verified, but live enabled methods depend on the Clerk dashboard configuration and were not exercised against a real account in this task.
- Analytics persistence and loading are locally tested; no live Google Analytics network request or remote `user_preferences` row was mutated.
- Task 5 must land and be verified before exposing account deletion. Task 7 must land before Product Experience becomes discoverable or gains restart controls.

---

## Fix Round 1 — 2026-08-23

This section supersedes the original account-deletion, API-key atomicity, Product Experience, legal-copy, and follow-up statements above.

### Release-blocking corrections

- Added an additive `settings_security_contract` migration with two service-role-only, `security invoker` functions:
  - `create_api_key_atomic` locks the Clerk-owned `users` row, derives the active-key limit from the stored plan, counts active keys only, inserts the SHA-256 hash, and returns exactly one owner row. Concurrent free-plan attempts produce one row and one `API_KEY_LIMIT_REACHED` failure.
  - `process_clerk_user_lifecycle_event` transactionally deduplicates signed Clerk events, updates only the event user’s primary email, and deletes only the event user. Before deletion it fails closed if any public table with a `user_id` column lacks an `ON DELETE CASCADE` foreign key to `users`.
- Added the public `/api/webhooks/clerk` route using Clerk’s `verifyWebhook()` boundary for `user.updated` and `user.deleted`. Database errors return 500 so Clerk can retry; malformed or unsigned lifecycle events fail without mutation.
- Replaced CSS-only deletion hiding with a server capability boundary. The Clerk `UserProfile` component is not mounted unless all three settings are present: `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_USER_LIFECYCLE_SYNC_ENABLED=true`, and `CLERK_USER_LIFECYCLE_CONTRACT=vesperwise-clerk-lifecycle-v1`. The default is closed. When enabled, Clerk owns the complete account/security surface, including deletion.
- Documented the webhook subscription and capability contract in `README.md`, and made `/api/webhooks/clerk` public in Clerk middleware.
- Replaced count-before-insert API-key creation with the atomic RPC. The route still validates strict labels, derives its user from Clerk, returns the raw secret once, verifies the single returned owner row, and never returns or stores plaintext.
- GA now queues consent even before the Google library exists, sends `denied` on persisted opt-out and `granted` on persisted opt-in, supports opt-out → opt-in without reload, and renders only one loader/config pair.
- Active Product Experience records (`tour_version > 0`) now expose a real restart action that optimistically persists `tour_status=not_started` and `tour_step=0` while preserving `tour_version`; failures roll back and remain retryable. Version 0 still has no action and remains hidden from manifest discovery.
- Business Profile now treats typed-but-not-added custom values as unsaved, announces loading, and uses an accessible in-app discard dialog for owned Settings/same-origin links plus best-effort browser history guarding. The dialog focuses the safe action, traps focus, handles Escape, and restores focus.
- API-key revoke confirmation now focuses the safe action, traps focus, handles Escape, restores its trigger, and preserves explicit confirmation/loading/error behavior. Copy success resets for every newly created secret.
- Replaced the Security page’s certification, SLA, logging, personnel, penetration-test, backup, and disaster-recovery representations with code-verifiable runtime boundaries. Removed placeholder legal links/actions and corrected Privacy, Terms, and DPA references to application-side service-role scoping, OpenRouter, persisted GA consent, and actually available controls.

### RED evidence

1. Capability gate, signed webhook, and GA transition tests initially failed because the capability module and webhook route did not exist and live opt-in never sent `granted`.
   - `npm test -- lib/clerk-account-capability.test.ts app/api/webhooks/clerk/route.test.ts components/google-analytics.test.tsx`
   - Result: 3 files failed; two missing production modules and one consent-transition assertion failed.
2. Atomic API-key route tests initially failed because POST still used count-before-insert and never invoked the database RPC.
   - `npm test -- app/api/user/api-keys/route.test.ts`
   - Result: 2 expected failures: verified RPC creation returned 500 and atomic limit errors were not mapped to 409.
3. Active tour tests initially failed because no restart component existed.
   - `npm test -- components/settings/product-experience-settings.test.tsx`
   - Result: missing production module.
4. Business Profile tests initially failed because typed custom values were not unsaved and loading had no accessible status.
   - `npm test -- 'app/(dashboard)/settings/business-profile/business-profile-page.test.tsx'`
   - Result: 2 expected failures.
5. Revoke-dialog behavior initially failed because focus stayed on the background revoke trigger.
   - `npm test -- components/settings/api-keys-manager.test.tsx`
   - Result: 1 expected focus failure.
6. The isolated cascade guard test initially failed because a synthetic `user_id` table without a cascade did not block deletion.
   - Executed with `SETTINGS_SECURITY_DB_TESTS=true` against disposable database `vesperwise_settings_test`.
   - Result: 1 expected failure before the catalog-backed fail-closed guard was added.
7. A second GA RED test proved an opt-in occurring before `gtag` existed lost the granted command; it passed after the queue bootstrap was added.

### Verification evidence

- Focused release-blocker suite: 10 files passed, 46 tests passed after the pre-`gtag` opt-in regression was added.
- Isolated executable PostgreSQL suite: 1 file passed, 6 tests passed, including concurrent active-limit serialization, active-only counting, update/delete idempotency, cross-user isolation, retry rollback, real child-row cascades, the missing-cascade fail-closed guard, and function privileges.
- Full suite, final: 63 files passed, 4 skipped; 331 tests passed, 18 skipped.
- Changed-file ESLint: exited 0 with no findings.
- `git diff --check`: exited 0 with no findings.
- Production build: compiled, TypeScript passed, 71 pages generated, and `/api/webhooks/clerk` plus all Settings routes were registered.

### Remaining deployment boundary

- The migration and webhook are locally implemented and executable-tested but were not pushed to a remote Supabase project or configured in Clerk. Keep the account capability environment flag false until the migration is applied, the production Clerk endpoint subscribes to `user.updated` and `user.deleted`, the signing secret is installed, and a signed production test verifies update and deletion cascades.
- Browser history APIs do not provide a universal interception hook for arbitrary programmatic navigation. The implementation covers owned Settings/same-origin anchors, `beforeunload`, and best-effort back/forward restoration without claiming to intercept unrelated `router.push` calls.
