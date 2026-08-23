# VesperWise product experience modernization implementation plan

Approved specification: the user-approved “VesperWise Product Experience Modernization” plan in the Codex task dated 2026-08-23. Preserve Clerk, Supabase, OpenRouter, Polar, scoring, billing, and business-profile boundaries. Do not expose fake settings or arbitrary generated code. Work test-first and keep compatibility routes during rollout.

## Global constraints

- Canonical AI route and product label are `/assistant` and “Assistant”. `/analyze` redirects there.
- Retire “Memory” only as a product concept. Preserve the business profile, its API/storage contract, custom values, and scoring behavior. `/memory` permanently redirects to `/settings/business-profile`.
- Use one typed navigation manifest for desktop, mobile, command palette, breadcrumbs, icons, gates, and tests.
- Settings shows only working capabilities. Unsupported models, BYO keys, email notifications, integrations, teams, roles, and export remain omitted.
- Onboarding is a three-stage activation flow ending in a guided but skippable first score. Draft, step, completion time, and version persist server-side.
- The tour is contextual, versioned, five steps, accessible, resumable, restartable, and remains dormant until every target including Assistant exists.
- Generative UI is controlled in-house: strict Zod contracts, registered native components, validated artifacts, allowlisted actions, human approval for mutation or extra-credit tools, and safe fallback. Never render arbitrary React, HTML, CSS, iframes, model URLs, generic forms, or unbounded chart specifications.
- Every service-role query is scoped to the Clerk user ID. Mutations verify that a row changed. All supplied thread/run/tool/artifact/action IDs are ownership checked.
- Retry must not repeat a charge or uncertain mutation. Regenerate is a disclosed new billable run.
- Use the existing design system and product identity. Prefer shared system fixes over page-specific overrides. Accessibility, reduced motion, and responsive behavior are release requirements.
- Baseline at plan approval: 230 tests passed, 9 skipped; production build and TypeScript passed; repository lint failed due to generated/tooling scope and genuine source violations.

### Task 1: Canonical navigation and Memory retirement

- Add a typed navigation manifest with deliberate groups: Workspace (Dashboard, Intent Hub, Score, later Assistant), Research (People, Watchlist, Lists, History), Automation (Bulk Score and Autopilot only when usable), Utilities (Inbox and Settings). Billing and API Keys live through Settings.
- Make sidebar, mobile drawer, command palette, breadcrumbs, icons, gates, and tests consume the manifest.
- Move the existing business-profile editor to `/settings/business-profile` without changing its persisted schema or scoring behavior.
- Make `/memory` a permanent compatibility redirect. Remove Memory crumbs, search entries, robots exclusions, copy, direct page implementation, and stale tests.
- Make `/settings` route to a real settings destination, not Memory.
- Add failing tests first for manifest consistency, route compatibility, active state, and profile relocation.

### Task 2: Authenticated shell structure and accessibility

- Isolate authenticated shell styles from landing `.app` styles with unique scope or CSS modules and remove precedence collisions that affect the shell.
- Use a fixed sidebar header/footer and scrollable grouped nav. Remove false chevrons, clickable “Soon” destinations, global zero band chips, and misleading no-op affordances.
- Make collapsed mode retain settings, account, theme, and sign-out access with real tooltips and no hydration width jump.
- Rebuild the mobile drawer with dialog semantics, explicit close, focus containment, Escape, focus restoration, scroll lock, and correct responsive/collapsed behavior.
- Add semantic breadcrumbs, `/inbox` metadata, accessible palette behavior, focus states, contrast, reduced motion, and short-height handling.
- Add component tests for keyboard and responsive shell behavior before implementation.

### Task 3: Durable user preferences foundation

- Add migration for one-to-one `user_preferences`: theme (`system|light|dark`), sidebar collapse, analytics enabled, onboarding version/step/draft, tour version/status/step/timestamp, and updated timestamp.
- Add `users.onboarding_completed_at` while retaining the boolean.
- Add typed Zod contracts and authenticated strict `GET/PATCH /api/user/preferences`; reject unknown fields, scope by Clerk ID, support false values, upsert safely, and verify mutations.
- Hydrate theme/sidebar preferences without layout shifts, update optimistically, and roll back on error.
- Add migration/contract/API/unit tests first.

### Task 4: Functional Settings product

- Build responsive Settings secondary navigation, page headers, loading/error states, and routes for Account, Business profile, Appearance, Product experience, Developer, and Data & privacy.
- Account/security delegates identity, email, avatar, password, MFA, sessions, and account management to Clerk rather than duplicating identity fields.
- Business profile reuses the current contract with explicit save, validation, retry, custom values, and unsaved-change protection.
- Appearance persists System/Light/Dark and sidebar preference.
- Product experience displays the real tour state and restart control once the tour is active.
- Developer completes the existing API-key backend UI with validation, limits, copy-once secret, revoke confirmation, and verified mutations. Billing links to the existing Polar-backed workspace.
- Data/privacy gates analytics loading with persisted consent and provides accurate legal links. Reconcile GA, OpenRouter, storage keys, deletion, and AI-control copy with runtime.
- Add route/component/API tests first. Do not add unsupported placeholder settings.

### Task 5: Clerk lifecycle integrity

- Harden provisioning and profile mutation zero-row/error handling.
- Add a signed Clerk `user.updated`/`user.deleted` webhook that synchronizes email changes and cascades deletion through the Supabase user graph.
- Do not expose account deletion until webhook verification and cascade behavior are tested.
- Add webhook signature, replay/error, missing-user, synchronization, and deletion tests first.

### Task 6: Activation-led onboarding and score corrections

- Replace the current flow with three progressively disclosed stages: offer/target account; buyer/sales motion/deal size/cycle; first company score and optional watchlist.
- Debounced autosave of valid drafts and step to server preferences with saving/saved/unsaved/error UI; resume after refresh/logout.
- Save complete business profile before activation without completing onboarding.
- On first-score success or explicit skip, idempotently set boolean, completion timestamp, and version. Do not replay completed onboarding.
- Provider/unscorable/coverage failures offer retry, change domain, and skip.
- Derive activation from persisted score/watchlist data.
- Fix `/score` to use Clerk identity, validate blank domain, and surface watchlist errors.
- Add reducer/API/component/integration tests first.

### Task 7: Contextual product tour

- Implement a route-aware five-step tour for Dashboard, Score, Intent Hub, Assistant, and navigation/Settings.
- Support Skip, Back, Next, Finish, dismissal, refresh resume, manual restart, version upgrades, and Dashboard return.
- Use stable `data-tour` anchors, focus management, keyboard controls, ARIA labels/live feedback, reduced motion, responsive fallback positioning, and automatic mobile drawer opening for nav targets.
- Persist state in `user_preferences`; local state is never authoritative.
- Keep automatic playback disabled until Task 10 verifies Assistant and all targets; activate via a tour version bump.
- Add reducer/versioning/focus/positioning tests first.

### Task 8: Controlled Generative UI contracts and tool registry

- Split monolithic Copilot logic into shared contracts, server registry/executors, and client renderer registry.
- Define strict Zod input/output for every tool, classification (`read|billable|mutation`), confirmation policy, safe progress/errors, and deterministic result-to-artifact mapping. Derive provider JSON Schema from those definitions.
- Define ordered `AssistantEvent`, versioned discriminated `AssistantArtifact`, and allowlisted `AssistantAction` contracts.
- Support native company intent, person intent, account results, comparison, pipeline snapshot, conversation analysis, editable outreach draft, confirmation, activity, empty, and fallback artifacts grounded in real tools.
- Validate artifacts on server and client; invalid/unknown artifacts preserve assistant text and render a recoverable native fallback without raw JSON.
- Add contract/registry/policy/fallback tests first.

### Task 9: Durable and secure Assistant runtime

- Add backward-compatible migrations for chat runs, tool calls, artifacts, action proposals, and private screenshot attachments; add stable IDs, sequence/status, idempotent client message IDs, revisions, and structured message parts.
- Add atomic run-start behavior that ownership-checks the thread, inserts the user message/run, reserves 0.25 chat credit, and deduplicates client message IDs.
- Fix foreign-thread access, latest-50 history, validation, six-round/ten-call/time caps, sanitized errors, cancellation, and confirmation expiry/ownership/idempotency.
- Replace pseudo-streaming with genuine OpenRouter streaming and ordered SSE lifecycle events for run, message deltas, tools, artifacts, credits, completion/failure/cancellation.
- Persist tool-only results, partial states, artifacts, errors, and completed action proposals before emission where required.
- Retry a failed run without another charge or repeated mutation. Regenerate creates a disclosed billable run.
- Validate and privately persist at most one JPEG/PNG/WebP screenshot per message. Do not advertise documents.
- Add ownership, idempotency, streaming, malformed data, failure, approval, cancellation, attachment, and retry tests first.

### Task 10: Assistant workspace and native artifacts

- Build `/assistant` with thread list, new/rename/archive/confirmed-delete, empty state, supported prompt suggestions, transcript, native artifacts, long responses, sticky composer, screenshot attachment, tool states, Stop, Retry, Regenerate, reconnect recovery, and Jump to latest.
- Build mobile thread sheet and viewport-safe composer. Preserve focus, accessible transcript semantics, restrained ARIA live announcements, reduced motion, and near-bottom-only autoscroll.
- Make allowlisted artifact actions execute through ownership-checked stored proposals; refresh affected product state after confirmed actions.
- `/analyze` redirects to `/assistant`; keep existing chat endpoints as compatibility delegates where appropriate.
- Enable Assistant navigation and tour v1 only after backend, UI, persistence, and safety tests pass.
- Add component and integration tests first.

### Task 11: Product-wide design/state polish

- Establish one authoritative token layer for colors, typography, spacing, radii, control heights, elevation, focus, and motion.
- Restrain shared Button/Card/Input/Dialog/Select/Tooltip/Toast defaults; remove unjustified pills, glow, hover lift, excessive borders, and rounded containers.
- Add shared skeleton, empty, inline error, destructive confirmation, page loading/error, global error, and not-found primitives with real recovery.
- Replace native prompt/confirm, swallowed errors, null Suspense fallbacks, and page-specific spinners.
- Wire or remove fake ranges, tabs, chevrons, exports, availability badges, and charts.
- Fix contrast, dynamic viewport sizing, layout shifts, icon alignment, table overflow, keyboard focus, live regions, reduced motion, and responsive behavior across authenticated routes.
- Fix source lint violations and constrain ESLint/Knip away from `.claude`, generated graphs, nested worktrees, and build output.
- Add focused tests for shared states and regressions before each fix.

### Task 12: Verification and release evidence

- Run TypeScript, source-scoped lint, Vitest, dead-code analysis, production build, and migration contract tests.
- Add Playwright flows for onboarding resume/score/skip/tour, completed-user gating, tour restart, business-profile personalization, Assistant new/existing threads and approval/stop/retry/replay/mobile, appearance persistence, and settings navigation.
- Verify System/Light/Dark at 1440, 1180, 980, 640, and 390 widths and short laptop heights; verify keyboard, focus, responsive drawer, and no console errors.
- Keep migration deployment outside the local implementation unless separately authorized. Provide staging-first rollout instructions and distinguish local evidence from remote deployment state.
