# Task 7 report: Contextual product tour

## Status

Implemented and locally verified on top of Task 6 commit `707c93b`. The five-step route-aware engine, server-authoritative persistence seam, accessible host, mobile navigation handoff, Settings restart seam, and stable existing-page anchors are present. The checked-in active tour version remains `0`, so there is no automatic playback, no post-onboarding start, no active Product Experience control, and no Assistant exposure in this task.

No migration was added because Task 3 already supplied `tour_version`, `tour_status`, `tour_step`, and `tour_updated_at`. No local or remote migration was applied, and nothing was deployed.

## Implemented contract

### Versioned model and transitions

- `lib/product-tour.ts`
  - Defines the dormant `ACTIVE_PRODUCT_TOUR_VERSION = 0` activation gate.
  - Defines exactly five route-aware steps for Dashboard, Score, Intent Hub, Assistant, and navigation/Settings.
  - Implements bounded start, restart, next, back, skip, dismiss, and finish transitions.
  - Reconciles version upgrades without replaying a completed or dismissed current version.
  - Exposes strict progress and action schemas plus an optimistic reducer that rolls back to the last server-confirmed state.
- `lib/product-tour.test.ts`
  - Covers the dormant gate, exact route/anchor sequence, current-version replay prevention, version upgrades, bounded navigation, every terminal action, rollback, and authoritative reconciliation.

### Server-authoritative persistence

- `app/api/user/tour/route.ts`
  - Adds authenticated `GET` and action-based `POST /api/user/tour`.
  - Accepts only an action and the caller's expected prior version/status/step; clients cannot submit desired tour state or timestamps.
  - Computes the transition and `tour_updated_at` on the server.
  - Compare-and-swaps the Clerk-scoped row by user ID and prior version/status/step, requires one returned row, validates the complete persisted row, and rejects cross-owner results.
  - Returns controlled failures for malformed storage, storage errors, stale/zero-row writes, inactive versions, invalid requests, and unauthenticated access.
- `app/api/user/tour/route.test.ts`
  - Covers authenticated projection, malformed storage, strict client input, the version-zero gate, server-computed transitions/timestamps, Clerk scoping, stale state, storage errors, zero-row writes, and cross-owner results.
- `lib/user-preferences.ts` and its API/contract tests
  - Remove all tour-owned fields from generic preferences PATCH. Theme, sidebar, and analytics remain on the existing generic seam; tour state can mutate only through `/api/user/tour`.
  - No localStorage or other browser storage key was introduced for tour authority.

### Accessible route-aware host

- `components/dashboard/product-tour-host.tsx`
  - Resumes persisted in-progress state after refresh, routes to each step, and starts an older version only when the active version is nonzero.
  - Uses a labelled dialog, described content, restrained live step announcements, explicit Skip/Back/Next/Finish/dismiss controls, and retryable persistence errors.
  - Supports Escape, Left Arrow, Right Arrow, and contained forward/reverse Tab behavior.
  - Moves focus to the current heading and restores prior focus when guidance closes or changes route.
  - Highlights only the current stable target, scrolls it into view, honors reduced motion, updates on resize/scroll/content resize, and falls back to a centered viewport-safe placement when a target is unavailable.
  - Opens the mobile navigation drawer before resolving the Settings target and closes it after a terminal action.
  - Fails closed on malformed initial persisted progress.
- `lib/product-tour-focus.ts` and tests cover initial focus, restoration, and both Tab boundaries.
- `lib/product-tour-position.ts` and tests cover preferred placement, opposite-side fallback, clamping, and targetless centered fallback.
- `components/dashboard/product-tour-host.test.tsx` covers dormant non-playback, malformed-state closure, refresh resume, target highlighting, keyboard progress, Skip/Dashboard return, persistence rollback, version activation, and mobile Settings drawer handoff/Finish.

### Shell, anchors, and Product Experience

- `app/(dashboard)/layout.tsx` passes the verified server preference projection into the authenticated shell; `components/dashboard/dashboard-shell.tsx` hosts the dormant engine and supplies mobile drawer controls.
- Stable existing-surface anchors:
  - `data-tour="dashboard-overview"` on the Dashboard workspace overview.
  - `data-tour="score-domain"` on both mutually exclusive Score domain controls.
  - `data-tour="intent-hub-prioritization"` on Intent Hub.
  - `data-tour="navigation-settings"` on the canonical Settings navigation item.
- The future Assistant step intentionally targets `data-tour="assistant-workspace"`; Task 10 must add that anchor only after the real Assistant composer/results workspace exists.
- `components/settings/product-experience-settings.tsx` now restarts through the action endpoint, reconciles the returned server version/status/step, and returns to Dashboard.
- `app/(dashboard)/settings/product-experience/page.tsx` exposes that action only when the persisted version exactly matches a nonzero active version. Version `0` and stale/future versions remain non-actionable.
- Product Experience manifest availability is derived from the same active-version gate, so changing the activation constant later reveals the real control without a second feature flag.

## TDD evidence

### RED

1. Initial model/persistence/host run:
   - Command: `npm test -- lib/product-tour.test.ts lib/product-tour-position.test.ts lib/product-tour-focus.test.ts app/api/user/tour/route.test.ts components/dashboard/product-tour-host.test.tsx lib/user-preferences.test.ts app/api/user/preferences/route.test.ts components/settings/product-experience-settings.test.tsx`
   - Result: all 8 files failed as expected. Five new suites could not resolve their not-yet-created production modules; generic preferences still accepted tour fields; Product Experience still used the generic endpoint.
2. Anchor/activation integration run:
   - Command: `npm test -- lib/product-tour.test.ts components/dashboard/product-tour-host.test.tsx components/dashboard/nav.test.tsx 'app/(dashboard)/score/score-view.test.tsx'`
   - Result: 3 expected failures. The active-version predicate and the Settings/Score anchors did not exist; the already-built host suite stayed green.
3. Malformed persistence hardening run:
   - Command: `npm test -- components/dashboard/product-tour-host.test.tsx app/api/user/tour/route.test.ts`
   - Result: 2 expected failures. A malformed step could crash the host and produce an uncaught API schema error before fail-closed handling was added.
4. First production build:
   - Command: `npm run build`
   - Result: compilation reached TypeScript and correctly rejected direct access to the optional mobile-navigation property on the step union. The access was narrowed; the focused host suite remained green before the complete build was rerun.

### GREEN and final verification

- Focused Task 7 and adjacent regression suite:
  - Command: `npm test -- lib/product-tour.test.ts lib/product-tour-position.test.ts lib/product-tour-focus.test.ts app/api/user/tour/route.test.ts components/dashboard/product-tour-host.test.tsx components/dashboard/nav.test.tsx 'app/(dashboard)/score/score-view.test.tsx' components/settings/product-experience-settings.test.tsx app/api/user/preferences/route.test.ts lib/user-preferences.test.ts lib/dashboard-search.test.ts components/dashboard/search-palette.test.tsx 'app/(dashboard)/settings/settings-routes.test.ts'`
  - Result: 13 files passed, 87 tests passed.
- Changed TypeScript/TSX ESLint:
  - Command: `npx eslint` over every changed Task 7 TypeScript and TSX file.
  - Result: exit 0 with no findings.
- Full Vitest suite:
  - Command: `npm test`
  - Result: 81 files passed, 5 skipped; 439 tests passed, 24 skipped.
- Production build:
  - Command: `npm run build`
  - Result: compiled successfully, Next TypeScript passed, 74 static pages generated, and `/api/user/tour` was registered; exit 0.
- Diff hygiene:
  - Command: `git diff --check`
  - Result: exit 0 with no output.

## Review hardening

An independent read-only review found no security, ownership, or rollout leakage, but identified six interaction gaps. All were reproduced with focused tests before correction:

- Pre-write and post-read compare-and-swap conflicts now reconcile authoritative server progress. Zero-row and `PGRST116` races re-read through the Clerk-scoped preference loader before returning `409`; both host and Settings consume the returned tour instead of retrying stale state forever.
- Optimistic reducer state no longer triggers route navigation. In-progress route changes occur only after a server-confirmed or conflict-reconciled state; a failed transition stays on the current page.
- Tour-owned mobile navigation cedes dialog/focus-trap semantics to the tour, waits for the drawer transform transition (or the reduced-motion fast path) before measuring/focusing the target, and cannot be closed independently by its close button or backdrop.
- The shell pathname cleanup no longer overwrites newly established tour ownership. A real-shell mobile step-five test covers the effect ordering, non-modal drawer state, Settings target, and tour-heading focus.
- Reverse Tab from the initially focused heading and Tab arriving from outside are contained within the tour controls.
- Positioning now centers when a large target leaves no usable side instead of clamping an explicitly failed placement.

The final re-review reported no remaining critical or important findings and reconfirmed that the active version is `0`.

## Rollout gate and concerns

- Task 10 must keep Assistant hidden until its backend/UI safety work is complete, add the stable `data-tour="assistant-workspace"` anchor to the real composer/results workspace, then change `ACTIVE_PRODUCT_TOUR_VERSION` from `0` to `1`. That single tour version bump activates automatic version reconciliation and makes Product Experience discoverable; Assistant navigation availability remains Task 10's separate manifest responsibility.
- The current version-zero build cannot write tour transitions: even a direct `POST /api/user/tour` receives `409`. Product Experience therefore cannot claim a functional active tour early.
- Responsive placement, focus, keyboard, mobile drawer, and reduced-motion behavior have deterministic unit/component coverage. Cross-browser visual/E2E verification remains part of Task 12; this task does not claim browser-matrix evidence.
- Persistence is locally contract-tested with a PostgREST-shaped harness and existing migration coverage. No remote Supabase row, hosted deployment, or production behavior was changed or verified.
