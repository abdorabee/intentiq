# Phase 3 Report — Settings foundation

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commit:** `475513d` — Add Settings foundation with Account, appearance, and experience

## What shipped

`/settings` is a real Account hub. Nested Settings sections share one layout. Theme, tour, and role now persist through real APIs. The selling-profile editor uses dashboard tokens instead of Memory cyan/slate.

### Settings IA

| Section | Path | Behavior |
|---|---|---|
| Account | `/settings` (`/settings/account` redirects here) | Clerk `UserProfile` (hash routing) for identity; app-owned role editor writes `users.role` |
| Selling profile | `/settings/selling` | Existing ICP editor, restyled; still saves via `PUT /api/user/profile` |
| Appearance | `/settings/appearance` | Light / Dark / System |
| Experience | `/settings/experience` | Restart tour + reset onboarding |
| Billing | `/settings/billing` | Still redirects to `/billing` |

Omitted on purpose: email notifications, integrations, model picker, density, scoring-policy editor, API key management.

### Persistence

1. **Migration** `supabase/migrations/20260823000000_user_preferences.sql` adds `users.preferences jsonb not null default '{}'`. Not applied to a remote database.
2. **`GET/PATCH /api/user/preferences`** reads/writes `{ theme, product_tour_completed, product_tour_version }` with merge semantics. Empty or unknown patches are rejected.
3. **`PATCH /api/user/profile`** accepts `{ role: "sdr" \| "ae" \| "manager" }` and `{ onboarding_completed: false }`. Admin cannot be self-assigned. `GET /api/user/profile` now returns `role`. Existing `PUT` profile contract is unchanged.
4. **Theme cache** still uses `localStorage` key `intentiq-theme`. Values are now `light` \| `dark` \| `system`. The root FOUC script and `ThemeProvider` resolve System from `prefers-color-scheme`. Signed-in sessions hydrate from the API; nav toggle and Appearance both persist remotely (401 on public pages is local-only).

### UI

- Shared `settings/layout.tsx`: desktop side nav, mobile `<select>` at 980px.
- Account role radios: SDR / AE / Manager. Admin is shown only when already set.
- Appearance radios write immediately (optimistic) with sonner success/error and rollback on failure.
- Experience: Restart tour sets `product_tour_completed: false`. Reset onboarding uses `components/ui/dialog.tsx`, then `PATCH` + redirect `/onboarding`.
- Selling profile restyle uses `.page-title`, `.tb-btn`, `.btn-primary`, `--text-primary`, `--border`, `--brand-soft`. No `cyan-*` classes remain.

## Files

- `app/(dashboard)/settings/layout.tsx` — shared nav
- `app/(dashboard)/settings/page.tsx` — Account
- `app/(dashboard)/settings/account/page.tsx` — redirect to `/settings`
- `app/(dashboard)/settings/appearance/page.tsx`
- `app/(dashboard)/settings/experience/page.tsx`
- `app/(dashboard)/settings/selling/page.tsx` — restyle
- `app/api/user/preferences/route.ts`
- `app/api/user/profile/route.ts` — GET role + PATCH
- `components/theme-provider.tsx` / `app/layout.tsx` — System theme
- `components/settings/clerk-user-profile.tsx`
- `components/settings/account-role-editor.tsx`
- `lib/user-preferences.ts`, `lib/theme.ts`, `lib/user-role.ts`, `lib/settings-nav.ts`
- `lib/types.ts` — `DbUser.preferences`
- `components/dashboard/dashboard-topbar.tsx` — Appearance / Experience crumbs
- `lib/dashboard-search.ts` — account / experience / theme keywords
- `app/globals.css` — settings tokens
- `supabase/migrations/20260823000000_user_preferences.sql`

## Tests

Focused:

```
npx vitest run lib/user-preferences.test.ts lib/theme.test.ts lib/user-role.test.ts lib/settings-nav.test.ts supabase/migrations/user-preferences-migration.test.ts components/dashboard/nav.test.ts lib/dashboard-search.test.ts
```

Result: **7 files, 35 tests, all passed**.

Broader:

```
npx vitest run
```

Result: **37 passed / 1 skipped files; 189 passed / 5 skipped tests**.

Covered:

- Preference normalize / patch / merge
- Theme storage key, System resolution, explicit toggle
- Role patch rejects admin promotion and `onboarding_completed: true`
- Onboarding reset redirect is `/onboarding` only after the flag is cleared
- Settings nav treats `/settings` and `/settings/account` as Account
- `/settings` no longer redirects to selling; `/memory` still does
- Selling page has no Memory/`cyan-` branding
- Breadcrumbs include Appearance and Experience
- Migration adds `users.preferences` jsonb

`npx tsc --noEmit` reports only the pre-existing `@/public/vesperwise-logo.png` module error.

## Self-review

- Every visible Settings control writes to a real API or is Clerk-owned identity.
- No second chat surface, no scoring rewrite, no CopilotKit.
- Dashboard tokens only; Memory cyan branding removed from selling.
- Keyboard: nav links, native select, radio buttons, dialog, focus-visible rings, `prefers-reduced-motion` on settings chrome.
- Mobile select appears at the same 980px sidebar breakpoint.

## Concerns

1. **Migration is file-only.** `GET/PATCH /api/user/preferences` will 500 until `20260823000000_user_preferences.sql` is applied. Appearance and tour restart depend on that column.
2. **No authenticated browser pass.** There is no `.env.local` and no signed-in session in this environment. Clerk UserProfile, role save, theme persist, and the onboarding-reset dialog were not exercised as a logged-in user. Closest substitute: unit tests + source contracts.
3. **Product tour UI is still Phase 5.** Restart tour only clears `product_tour_completed`.
4. **Clerk chrome.** `UserProfile` is themed to match dark/light and lime, but Clerk’s own account nav (security, deletion) remains. Hash routing avoids colliding with `/settings/selling`.
5. **Admin is one-way from this UI.** The API refuses `role: "admin"`. An existing admin can switch to SDR/AE/Manager and cannot restore Admin here.
6. **Nav Appearance control is still a Light/Dark toggle**, not a link to `/settings/appearance`. System can only be chosen on the Appearance page; the menu then shows the resolved theme.
