# Phase 4 Report — Onboarding as activation

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commit:** `f0ecd7b` — Rebuild onboarding as a 5-step Score activation flow

## What shipped

Onboarding is a 5-step activation wizard that uses dashboard tokens, persists mid-flow, and lands on Score.

### Steps

| # | Step | Required | Persist |
|---|---|---|---|
| 1 | Offer — what you sell | Yes | Continue → step + draft |
| 2 | Accounts — industries + company size | Yes | Continue → step + draft |
| 3 | Motion — buyer + sales motion | Skip allowed | Continue or Skip |
| 4 | Commercial — deal size + cycle | Skip allowed | Continue or Skip |
| 5 | First score — Score composer | Skip allowed | Skip finishes; Score success goes to `/score?domain=…` |

Skip on step 5, or “Continue to Score” after a failed score, marks onboarding complete and lands on **`/score`**, not `/dashboard`.

Completed users still bounce off `/onboarding` via `getOnboardingRedirect` → `/dashboard`. Incomplete users still cannot enter dashboard routes.

### Persistence / resume

Simplest real path: **`users.preferences`**.

- Each Continue/Skip PATCHes `{ onboarding_step, onboarding_draft }` through `GET/PATCH /api/user/preferences`.
- The onboarding page reads `preferences` + `business_profile` and hydrates with `resolveOnboardingResume`.
- Finish / successful first score `PUT`s `business_profile` (sets `onboarding_completed: true`) and clears the step (`onboarding_step: 0`, `product_tour_completed: false`).
- Settings → Experience reset still sets `onboarding_completed: false` and now also `onboarding_step: 0` so replay starts at Offer with existing answers.

Offer + accounts remain required for a completable profile. Motion/commercial may be blank. `businessProfileSchema` was relaxed to match.

### UI

Rebuilt `components/onboarding/onboarding-wizard.tsx`: no glow orbs, no isolated marketing sidebar. Uses `.page-title`, `.settings-choice`, `.btn-primary`, `.tb-btn`, `--bg` / `--text-primary` / `--brand`. First score reuses `.prompt-holder--compact` / `.prompt-go` / `.sugg`.

Tour overlay is not implemented (Phase 5). Finish sets `product_tour_completed: false`.

## Files

- `lib/onboarding-profile.ts` — 5 steps, skip, resume, complete destination
- `lib/onboarding-profile.test.ts` — skip, persist/resume, `/score` destination
- `lib/user-preferences.ts` — `onboarding_step` + `onboarding_draft`
- `lib/business-profile.ts` — skippable fields may be blank
- `components/onboarding/onboarding-wizard.tsx`
- `components/onboarding/onboarding-wizard.test.ts` — source contracts
- `app/onboarding/page.tsx` — hydrate step + draft
- `app/(dashboard)/settings/experience/page.tsx` — reset step to 0
- `app/globals.css` — `.onboarding-*` token layout

## Tests

Focused:

```
npx vitest run lib/onboarding-profile.test.ts components/onboarding/onboarding-wizard.test.ts lib/user-preferences.test.ts lib/business-profile.test.ts
```

Result: **4 files, 39 tests, all passed**.

Broader:

```
npx vitest run
```

Result: **37 passed / 1 skipped files; 211 passed / 5 skipped tests**.

Covered:

- Offer/accounts required; motion/commercial validate on Continue only
- Skip allowed on steps 3–5; refused on 1–2
- `buildBusinessProfile` succeeds with blank skippable fields
- Persist payload is a valid preferences patch; resume restores step + draft
- Finish without a domain → `/score`; with a domain → `/score?domain=…`
- Completed users still bounce `/onboarding` → `/dashboard`
- Wizard has no glow-orb chrome and does not route to `/dashboard`

## Self-review

- Every control writes to preferences, profile, or `/api/v1/score`, or is omitted.
- No tour overlay, no CopilotKit, no scoring rewrite.
- Dashboard tokens only. Keyboard: step buttons, choices, form submit, Skip/Back, focus-visible rings, `prefers-reduced-motion` on chrome.
- Mobile: step labels hide under 700px; composer and footer wrap.

## Concerns

1. **No authenticated browser pass.** There is no signed-in session here. Persist/resume, first score, and skip-to-Score were not exercised as a logged-in user. Closest substitute: unit tests + source contracts.
2. **First score then `/score?domain=` auto-scores again.** Score view scores `?domain=` on load. The onboarding POST should be a cache hit (free) if the profile hash matches.
3. **Failed score after a successful profile PUT leaves onboarding complete.** Refresh then bounces to `/dashboard` instead of staying on the first-score step. The in-page error offers “Continue to Score”.
4. **Preferences migration is still file-only.** Mid-flow persist 500s until `users.preferences` exists remotely. Finish via `PUT /api/user/profile` still works.
5. **Product tour is still Phase 5.** Finish only sets `product_tour_completed: false`.
