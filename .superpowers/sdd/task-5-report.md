# Phase 5 Report — Product tour

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commit:** pending (see git)

## What shipped

A custom 5-step product tour (no vendor) starts on the first `/score` visit when `product_tour_completed` is not true. Skip, Next, Back, Finish, and Escape dismiss or advance. Finish/Skip/Escape persist `{ product_tour_completed: true, product_tour_version: 1 }` via `PATCH /api/user/preferences`. Completed tours never auto-replay.

Settings → Experience restart sets `product_tour_completed: false`, dispatches `vesperwise:product-tour-restart`, and routes to `/score`.

### Steps

| # | Step | Target | Fallback |
|---|---|---|---|
| 1 | Score workspace | `score-workspace` | — |
| 2 | Domain and follow-ups | `score-composer` | — |
| 3 | Generated result | `score-result` | composer if skipped |
| 4 | Intent Hub | `nav-intent-hub` | `nav-menu` if off-screen |
| 5 | Settings | `nav-settings` | `nav-menu` if off-screen |

Off-screen targets (sidebar drawer on ≤980px) are retargeted or skipped. Overlay is a dim scrim + spotlight + compact card using dashboard tokens. Focus is trapped in the card. `prefers-reduced-motion` disables card/spotlight transitions.

## Files

- `lib/product-tour.ts` — steps, start/replay rules, persist/restart payloads, targeting
- `lib/product-tour.test.ts` — persist, no auto-replay, restart flag, step list, retarget
- `components/product-tour/product-tour.tsx` — overlay, focus trap, Escape, preferences I/O
- `components/product-tour/product-tour.test.ts` — source contracts
- `components/dashboard/dashboard-shell.tsx` — mounts tour
- `app/(dashboard)/score/score-view.tsx` — Score targets
- `components/dashboard/nav.tsx` / `dashboard-topbar.tsx` — Hub, Settings, menu targets
- `app/(dashboard)/settings/experience/page.tsx` — restart routes to `/score`
- `app/globals.css` — `.product-tour-*`

## Tests

```
npx vitest run lib/product-tour.test.ts components/product-tour/product-tour.test.ts lib/user-preferences.test.ts components/dashboard/nav.test.ts
```

Result: **4 files, 37 tests, all passed**.

Covered:

- Step list is Score workspace → composer → result → Intent Hub → Settings
- Completion patch is a valid preferences write (`product_tour_completed: true`, version 1)
- Completed preference does not start the tour on `/score` or elsewhere
- Restart patch is `product_tour_completed: false`; href from Settings is `/score`
- Missing result falls back to composer; off-screen sidebar falls back to menu or is skipped

## Self-review

- No tour library. Every control writes preferences or navigates.
- Tokens only: `--bg`, `--bg-elevated`, `--border`, `--text-*`, `.tb-btn`, `.btn-primary`.
- Keyboard: Tab cycles the card, Escape persists and closes, Back disabled on step 1.
- Responsive: sidebar steps retarget to the hamburger when the drawer is off-canvas.

## Concerns

1. **No authenticated browser pass.** There is no signed-in session here. Overlay, spotlight placement, and Settings restart were not exercised as a logged-in user. Closest substitute: unit tests + source contracts.
2. **Preferences migration is still file-only.** Persist and first-visit GET 500 until `users.preferences` exists remotely. Restart then fails closed with a toast.
3. **Mobile Hub/Settings spotlight the menu button**, not the drawer items. Opening the drawer during those steps would teach the real links but fights overlay z-index.
4. **Existing users with default `product_tour_completed: false`** will see the tour on their next Score visit. That is the intended first-visit rule.
