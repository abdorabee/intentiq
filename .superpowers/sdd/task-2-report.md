# Phase 2 Report — Navigation

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commit:** `1f99389` — Rebalance dashboard nav and move ICP editor to Settings

## What shipped

Memory is no longer a nav or product surface. The sidebar is grouped, Settings is a real destination, `/memory` redirects into Settings, and the ICP editor lives at `/settings/selling`.

### Information architecture

| Section | Items |
|---|---|
| Workspace | Dashboard `/dashboard`, Score `/score`, Intent Hub `/pipeline` |
| Accounts | Watchlist `/watchlist`, Lists `/lists`, People `/people` (Beta), History `/history` |
| Operations | Bulk Score `/bulk`, Inbox `/inbox`, Autopilot `/autopilot` (Soon) |
| Account | Settings `/settings`, Billing `/billing`, API Keys `/api-keys` (Soon) |

### Structural fixes

1. **Settings** is a real Account item pointing at `/settings`.
2. **User row is a working menu** (`aria-haspopup="menu"`): Settings, Appearance (theme toggle with current Dark/Light state), Sign out. Workspace chevron removed; `sb-head` is no longer pointer/hover-interactive. User chevron sits on the real menu button.
3. **Single `DashboardNav`** still used for expanded, collapsed, and mobile drawer.
4. **Search registry** replaces Profile → `/memory` with Settings → `/settings`. Keywords: `profile icp selling appearance settings business profile`.
5. **Breadcrumbs:** `/memory` crumb removed; `/inbox` added; `/settings` current label is Settings; `/settings/selling` is Settings / Selling profile. Other crumbs now use the matching section parent.
6. **`app/robots.ts`:** `/settings/` added; `/memory/` kept because the redirect still exists.
7. **`/memory`** is `redirect("/settings/selling")`.
8. **`/settings/selling`** hosts the relocated ICP editor. `/settings` temporarily redirects there. `[MEMORY]` branding label stripped; title is “Selling profile”. No extra Settings sections invented.
9. **Tests rewritten** in `components/dashboard/nav.test.ts`; search coverage added in `lib/dashboard-search.test.ts`.

## Files

- `components/dashboard/nav.tsx` — grouped sections + user menu
- `components/dashboard/dashboard-topbar.tsx` — crumbs
- `lib/dashboard-search.ts` — Settings registry
- `lib/dashboard-search.test.ts` — new
- `components/dashboard/nav.test.ts` — rewritten
- `app/(dashboard)/memory/page.tsx` — redirect
- `app/(dashboard)/settings/page.tsx` — redirect to selling
- `app/(dashboard)/settings/selling/page.tsx` — relocated ICP editor
- `app/robots.ts`
- `app/globals.css` / `app/theme-overrides.css` — user menu + non-clickable workspace head; sidebar `overflow-y: auto` so extra section labels do not clip

## Tests

```
npx vitest run components/dashboard/nav.test.ts lib/dashboard-search.test.ts
```

Result: **2 files, 11 tests, all passed** (vitest 4.1.10).

Covered:

- No Memory href or Profile label in sidebar
- Settings href present
- Section labels Workspace / Accounts / Operations / Account
- Shared nav for expanded / collapsed / mobile
- User menu source contains Settings, Appearance, Sign out
- `/memory` and `/settings` redirect to `/settings/selling`
- Selling page exists and has no `[MEMORY]` label
- Search registry has no `/memory`
- Breadcrumbs omit `/memory`, include Inbox + Settings

## Self-review

- IA matches the brief exactly (order and badges).
- No second chat surface, no Settings hub beyond selling relocation.
- Existing `.sb-*` tokens reused; menu styles stay in that language.
- Collapsed items keep `title` tooltips; mobile drawer still uses one `DashboardNav`.
- Accessibility: menu trigger is a `<button>`, Escape/click-outside close, focus-visible rings, `prefers-reduced-motion` on the menu.

## Concerns

1. **No authenticated browser pass.** There are no browser tools in this environment. User-menu open/toggle/sign-out and the selling-page save path were not exercised as a logged-in user. Closest substitute: source tests + route-file redirects.
2. **Selling page is a functional move, not a restyle.** Cyan/slate Memory styling remains. Phase 3 is expected to restyle it.
3. **User menu is Tab/Escape, not arrow-key roving tabindex.** Controls work; full menubar keyboard pattern is not implemented.
4. **`/settings` still redirects** to selling until Phase 3 builds the Account hub.

## Out of scope (left alone)

Settings Account/Appearance/Experience hubs, onboarding rewrite, tour, chat, design-system overhaul, landing-page mock sidebar.
