# Phase 8–9 Report — Product polish + verification

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commits:**
- `1bdb8ee` — Polish shared empty states, tokens, and motion
- `ebf49d2` — Fix tsc image imports and ignore local Claude helpers in lint

## What shipped

One empty-state pattern (title, one sentence, one action) via `lib/empty-state.ts` + `components/empty-state.tsx`. Wired on History, People, Watchlist, Lists, Inbox, and Dashboard-when-zero-scores. Filtered empties keep title + sentence and drop the action.

Dashboard with zero scores no longer renders the KPI strip, fake sparklines, or distribution grid. It shows the page title and a Score CTA.

Leftover Score empty-state chrome was removed: `.prompt-h1 .grad`, `.prompt-feature-row`, `.prompt-bg` glow. People score prompt is now quiet (no gradient headline, no feature pills). Light `:root` primaries use lime product tokens instead of leftover purple shadcn hues. `components/ui/button.tsx` and the dashboard button layer use `--r-md` and the modest `.btn-primary` shadow (no pill glow / lift).

Focus rings and `prefers-reduced-motion` were added for sidebar items, the product tour card, and the chat “Working…” pulse.

No new product features. No fake settings.

## Files

- `lib/empty-state.ts` / `lib/empty-state.test.ts` / `components/empty-state.tsx`
- History / People / Watchlist / Lists / Inbox / Dashboard home
- `components/ui/button.tsx`, `app/globals.css`, `app/theme-overrides.css`
- `types/static-assets.d.ts`, `tsconfig.json`, `eslint.config.mjs`

## Verification

### `npx tsc --noEmit`

Exit **0**. No output.

Previously failed on `@/public/vesperwise-logo.png` because `next-env.d.ts` is gitignored. Fixed with a committed `types/static-assets.d.ts` PNG module declaration.

### `npm run lint`

Exit **1**.

```
✖ 43 problems (34 errors, 9 warnings)
```

None of those 34 errors are in files changed for this polish. Scoped lint of this branch’s files:

```
npx eslint lib/empty-state.ts lib/empty-state.test.ts components/empty-state.tsx \
  components/ui/button.tsx components/lists/list-overview.tsx \
  components/inbox/inbox-list.tsx components/inbox/inbox-detail.tsx \
  components/dashboard/home/dashboard-home.tsx \
  components/onboarding/onboarding-wizard.tsx \
  components/score/gen-ui/workspace.tsx \
  app/(dashboard)/history/history-view.tsx \
  app/(dashboard)/people/people-view.tsx \
  app/(dashboard)/watchlist/watchlist-view.tsx
```

Exit **0**. Empty output.

Pre-existing full-suite errors (not introduced here): `react-hooks/set-state-in-effect` and `react-hooks/purity` in Autopilot, History page, nav, search palette, product tour; `react/no-unescaped-entities` on legal/pricing copy. `.claude/**` is now ignored so local agent helpers are no longer in the product lint run.

### `npm test`

Exit **0**.

```
Test Files  42 passed | 1 skipped (43)
     Tests  260 passed | 5 skipped (265)
```

Empty-state helper: `npx vitest run lib/empty-state.test.ts` — **1 file, 5 tests, all passed**.

### `npm run build`

Exit **0**. Did not fail on missing env keys.

```
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully in 11.5s
✓ Generating static pages using 3 workers (71/71)
```

71 app routes generated. No `.env.local` was present.

## Concerns

1. **Full `npm run lint` is not green.** 34 pre-existing errors remain outside this phase’s files. Making that suite exit 0 would mean rewriting Autopilot, History stats, nav, search, tour, and legal/pricing copy.
2. **No authenticated browser pass.** Empty states, light theme, focus rings, and reduced motion were not clicked through as a signed-in user. Closest substitute: helper tests + source wiring.
3. **People Import CSV / Export** are now disabled “Coming soon” (they were dead controls). History still has non-functional Stage / Filter / Sort chrome that was out of scope.
4. **Dashboard empty** hides the whole metrics grid when band counts are zero. Credits remaining is not shown on that empty view.
