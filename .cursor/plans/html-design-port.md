---
name: HTML design port
overview: Port pasted reference HTML (Dashboard + Linear landing) into Next.js by aligning globals, dashboard shell/nav, landing sections, and key pages to the shared Linear-inspired token system and layout rules below.
todos:
  - id: add-html-refs
    content: Reference HTML captured (pasted in chat May 2026); optional copy to design-reference/ for offline diff
    status: completed
  - id: extract-tokens
    content: Map CSS variables below to app/globals.css + Tailwind @theme; set Inter as UI sans, JetBrains for mono
    status: pending
  - id: dashboard-shell
    content: Rebuild shell to 232px sidebar grid, topbar 44px, page chrome; align nav groups to reference (Workspace, Lists, credits, user)
    status: pending
  - id: landing-port
    content: Replace landing with Linear HTML sections (banner, sticky nav, hero+mock, trust, pillars, stats, features, pricing, CTA, footer)
    status: pending
  - id: pages-pass
    content: Rebuild /dashboard page to match KPI/chart/activity/movers/pipeline/signal-mix/heatmap/autopilot cards; lint + build
    status: pending
isProject: true
---

# IntentIQ redesign — plan (from pasted HTML)

## Source of truth

- **Dashboard reference:** full `<style>` + markup you pasted (title `Dashboard · IntentIQ`).
- **Landing reference:** full `<style>` + markup you pasted (title `IntentIQ — Pipeline intelligence…`).
- Both share one **visual system** (Linear-inspired greys + violet primary + cyan accent + hot/warm/cold bands). Dashboard is **13px** UI / `overflow: hidden` shell; landing is **16px** base / scrollable marketing page.

## Shared design tokens (implement in `app/globals.css` + `@theme`)

Map these to CSS variables (and Tailwind semantic colors where possible). Use **hex or the exact rgba** from the references; do not substitute the old “electric cyan” as the sole primary — the references use **violet `#5e6ad2` / `#7170ff`** for primary buttons and selection, and **cyan `#4ec9d8`** for accents, signal funding, dots, and gradients.

- **Surfaces:** `--bg` `#08090a`, `--bg-elevated` `#0e1011`, `--surface` `#131517`, `--surface-2` `#1a1d20`
- **Text:** `--text-primary` `#f7f8f8`, `--text-secondary` `#b4bbc8`, `--text-tertiary` `#8a8f98`, `--text-quaternary` `#62666d`
- **Borders:** `--border` / `--border-strong` / `--border-subtle` → `rgba(255,255,255,0.08)`, `0.13`, `0.04`
- **Brand:** `--accent` `#5e6ad2`, `--accent-2` `#7170ff`, `--cyan` `#4ec9d8`, `--cyan-soft` `rgba(78,201,216,0.16)`
- **Bands:** `--hot` / `--warm` / `--cold` plus matching `-bg` / `-border` rgba from the pasted `:root`
- **Destructive / down delta:** `--red` `#f87171`
- **Fonts:** Inter (sans), JetBrains Mono (mono), via `next/font` + Google parity
- **Radii:** 4 / 6 / 8 / 12px; landing also uses 16px for large cards (`--r-2xl`)

**Typography / motion**

- Dashboard `body`: 13px, letter-spacing `-0.006em`, font-feature `"ss01","cv11"`, antialiased.
- Landing `body`: 16px, line-height 1.5; display/hero sizes use `clamp(...)` as in reference.
- Selection: `background: rgba(94,106,210,0.45)` (both).

## Dashboard HTML → Next.js mapping

| Reference region | Target |
|------------------|--------|
| `.app` `grid-template-columns: 232px 1fr` `height: 100vh` | [`app/(dashboard)/layout.tsx`](app/(dashboard)/layout.tsx) wrapper + [`components/dashboard/dashboard-shell.tsx`](components/dashboard/dashboard-shell.tsx) |
| `.sidebar` (bg `#0a0b0d`, border, sections, search, lists, credits, user) | [`components/dashboard/nav.tsx`](components/dashboard/nav.tsx) (and possibly small presentational subcomponents) |
| `.main` / `.topbar` (44px, crumbs, band pills, search/filter/notif, `btn-primary`) | New **top bar** component or extend shell: breadcrumbs from route, actions; keep Clerk sign-out / theme toggles only if they fit reference (otherwise move into user row) |
| `.page` / `.page-head` / `.range-tabs` / `.tb-btn` | Shared **page header** primitive for dashboard routes; first consumer [`app/(dashboard)/dashboard/page.tsx`](app/(dashboard)/dashboard/page.tsx) |
| `.kpi` … `.grid-main` … `.grid-lower` … `.heatmap` … `.ap-row` | Implement as composed sections in `dashboard/page.tsx` (and/or `components/dashboard/home/*.tsx`) with static/mock data initially; wire to real APIs later where data exists |
| Responsive breakpoints in reference | `@media (max-width: 1280px)`, `980px` — mirror in Tailwind `max-*` utilities or a scoped CSS module |

**Nav labels in reference (Workspace):** Dashboard, Intent Hub, Score, Pipeline, People, Watchlist, Autopilot, Inbox. **Lists:** Q1 Targets, Enterprise SaaS, etc. Align [`NAV_ITEMS`](components/dashboard/nav.tsx) and add a **Lists** group + optional counts/indicators to match structure (routes can still 404 or “soon” if not built).

**Credits block:** “Credits this month”, mono value, progress bar gradient cyan → accent, “Top up” link → `/billing`.

## Landing HTML → Next.js mapping

| Reference section | Target |
|-------------------|--------|
| `.top-banner` | New component under [`components/landing/`](components/landing/), rendered above nav on [`app/page.tsx`](app/page.tsx) (or landing layout) |
| `nav.primary` sticky + blur | Replace/rework existing landing HUD/nav; link to `#product`, `#autopilot`, `#api`, `#pricing`, `#customers`; Log in → `/login`, Sign up → `/signup` |
| `.hero` + `.hero-screen-wrap` / `.app-screen` mock | Hero + embedded product preview (can be static JSX mirroring reference mock first) |
| `.trust`, `.pillars`, `.stats`, feature sections (`#score-section`, hub, autopilot, `#api`, quotes, `#pricing`, `.cta`, `footer.site-footer` | Replace current GSAP-driven sections in [`components/landing/LandingPage.tsx`](components/landing/LandingPage.tsx) and siblings, **or** one composed page that follows HTML order |

**Primary CTA on landing:** `.btn-accent` (violet) — map to Button variant or custom class.

## Current codebase gaps (what changes)

- [`app/globals.css`](app/globals.css) `.dark` theme today is cyan-forward glass; references are **near-flat dark** with **violet primary**. Plan: **re-theme** dark mode to match tokens above; keep shadcn structure (`--primary`, `--card`, etc.) but set values from this palette.
- Landing currently [`components/landing/LandingPage.tsx`](components/landing/LandingPage.tsx) + GSAP sections — reference is **CSS + static layout**; prefer **matching layout first**, then re-add motion only if it does not drift from reference.
- Dashboard [`DashboardNav`](components/dashboard/nav.tsx) uses `lg:ml-60` (~240px) and different IA — reference sidebar is **232px** fixed; shell should use CSS grid, not only margin offset.

## Implementation order (when executing)

1. **Tokens + fonts** — `globals.css`, ensure `next/font` loads Inter + JetBrains for app and marketing.
2. **Dashboard shell** — grid layout, sidebar width 232px, topbar, remove/replace conflicting grid background from old design if it clashes.
3. **Landing page** — section-by-section top to bottom per Linear HTML.
4. **`/dashboard` home** — port KPI + cards layout; use placeholder data where backend missing.
5. **Other routes** — apply shared `.page-head` / card chrome incrementally (`/pipeline`, `/watchlist`, etc.).
6. **Verify** — `npm run lint`, `npm run build`.

## Notes / decisions

- **232px vs 224px:** Dashboard reference uses **232px** sidebar; landing hero mock uses **224px**. Use **232px** for the **real app shell**; hero mock can stay 224px inside landing if it matches its own CSS.
- **Light mode:** References are dark-only. Keep existing light tokens as fallback or dim unused until product asks.
- **“Inbox” / extra nav items:** Present in HTML only; implement links as `#` or hide until product exists.

## Branch (when executing)

Per agent rules: `cursor/intentiq-html-redesign-93c5` (or current feature branch), commits in chunks: tokens → shell → landing → dashboard page.
