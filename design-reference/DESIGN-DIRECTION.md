# IntentIQ Design Direction

Reference document for agents and engineers building UI in this repo. When in doubt, **match the HTML prototypes** and the patterns below — not generic shadcn defaults.

For a rendered view of the system — every token, component and app pattern shown in both themes —
see `design-system/claude/` (regenerate with `node design-system/build.mjs`). Those cards are
generated from the app's own CSS, so where this document and a card disagree, the card is right.

---

## 1. What changed

IntentIQ is moving from a **generic shadcn card-grid dashboard** to a **Linear-inspired, data-dense product surface** defined by static HTML references at the repo root.

| Before | After |
|--------|--------|
| Tailwind + shadcn as primary UI | **CSS token system** + semantic class names from HTML |
| Padded pages with Card components | **Full-bleed or tight chrome** matching reference layouts |
| Cyan-forward glass aesthetic | **Near-flat dark** surfaces, a single **acid-yellow brand** (`#dfff00`), no secondary hue |
| One-off page styling | **Per-page `*-view.tsx`** clients + shared shell |

**Goal:** Dashboard pages should feel like one product — same sidebar, topbar, typography, borders, and band semantics — whether you're on Score, History, or People.

---

## 2. Source of truth (read these first)

| Reference | Route / use | Status |
|-----------|-------------|--------|
| [`IntentIQ Dashboard.html`](../IntentIQ%20Dashboard.html) | `/dashboard` | Ported (home cards, KPI grid) |
| [`IntentIQ Score.html`](../IntentIQ%20Score.html) | `/score` | Ported |
| [`IntentIQ History.html`](../IntentIQ%20History.html) | `/history` | Ported |
| [`IntentIQ People.html`](../IntentIQ%20People.html) | `/people` | Ported |
| [`IntentIQ Intent Hub.html`](../IntentIQ%20Intent%20Hub.html) | `/pipeline` | Partial / in progress |
| [`IntentIQ Autopilot.html`](../IntentIQ%20Autopilot.html) | `/autopilot` | **Coming soon** (UI built but gated; re-enable post-launch) |
| [`IntentIQ Lists.html`](../IntentIQ%20Lists.html) | `/lists` | Ported |
| [`IntentIQ Watchlist.html`](../IntentIQ%20Watchlist.html) | `/watchlist` | Ported |
| [`IntentIQ Billing.html`](../IntentIQ%20Billing.html) | `/billing` | Ported |
| [`IntentIQ Linear.html`](../IntentIQ%20Linear.html) | `/` landing | Ported |
| [`design-reference/FIGMA.md`](./FIGMA.md) | Marketing / landing | Figma file key for landing |

When implementing a page:

1. Open the matching `IntentIQ *.html` file.
2. Copy structure, class names, and spacing — not approximate Tailwind.
3. Port `<style>` rules into `app/globals.css` inside `@layer components { ... }`.
4. Wire real data from existing APIs; do not change backend unless required.

---

## 3. Design tokens

Tokens are declared in two places and **`app/theme-overrides.css` wins** — `app/layout.tsx`
imports it after `globals.css`, so it overrides by source order. Edit tokens there. The `:root`
and `.dark` blocks near the top of `globals.css` still carry a stale violet oklch palette and have
no visible effect. **Use CSS variables**, not hardcoded hex, in new code.

### Surfaces (dark — the app default)
- `--bg` `#000000` — app background, canvas dot-grids
- `--bg-elevated` `#111111` — cards, panes, inputs
- `--surface` `#111111` / `--surface-2` `#181818` — nested panels, pills
- Light mode mirrors all of these; never assume a `rgba(255,255,255,…)` wash will be visible.

### Tailwind utilities vs. ported classes
The ported reset lives in `@layer base`, so Tailwind utilities (`p-4`, `bg-primary`, `text-*`)
apply normally to every element including `<a>` and `<button>`. But the **ported semantic classes
are unlayered and still beat utilities** — inside ported markup use `.btn-primary` / `.tb-btn` /
`.sb-item`, not a Tailwind utility, or your utility will silently lose.

### Text
- `--text-primary` → headings, values
- `--text-secondary` → body
- `--text-tertiary` → labels, placeholders
- `--text-quaternary` → meta, hints

### Borders
- `--border`, `--border-strong`, `--border-subtle` — white at 8% / 13% / 4% opacity

### Brand
- `--brand` `#dfff00` — the single accent, for **fills, borders and glows**: primary actions
  (`btn-primary`, `Button` default), focus rings, the active nav indicator, `--chart-1`,
  credit meters.
- `--brand-ink` — the same accent for **text and icons**. `#dfff00` in dark mode, `#5f6d00` in
  light, where the raw brand would be 1.14:1 on white. Also available as the Tailwind utility
  `text-brand-ink`. Never set `color:` to `--brand`, `--accent`, `--accent-2` or `--cyan`; the
  only exceptions are surfaces hardcoded dark in both themes (`.code-surface`, the onboarding
  wizard).
- `--brand-hover` `#e8ff40`, `--brand-active` `#c8e600` — the interaction ramp.
- `--brand-soft` / `--brand-border` / `--brand-glow` — alpha tints for washes, hairlines, glow.
- `--primary-foreground` is **black**. White on yellow lands near 1.1:1 and is unreadable.
- `--accent` / `--accent-2` / `--cyan` are **aliases of the brand**, kept so the ported CSS keeps
  working. There is no violet and no cyan in the product any more; treat those names as legacy.
- The brand is not a status colour — intent bands own HOT/WARM/COLD, and success/warning/danger
  are their own tokens.

### Intent bands (core product language)
- **HOT** `--hot` green — high intent, active, positive delta
- **WARM** `--warm` amber — moderate / draft / trigger nodes
- **COLD** `--cold` grey — low intent, paused

Use `.band`, `.band-hot`, `.band-warm`, `.band-cold` with inner `.dot` — never invent new band colors.

### Radii
- `--r-sm` 4px · `--r-md` 6px · `--r-lg` 8px · `--r-xl` 12px

### Fonts
- **Sans:** Inter (`--font-sans`) — UI labels, prose
- **Mono:** JetBrains Mono (`--font-mono`) — scores, domains, workflow names, counts, deltas

---

## 4. Typography rules

| Context | Size | Font | Notes |
|---------|------|------|-------|
| Dashboard body | 13px | Inter | `letter-spacing: -0.006em` |
| Landing body | 16px | Inter | `line-height: 1.5` |
| Page title | 22px / 18px mono | Mixed | `.page-title` or `.ap-detail-name` |
| Stat values | 18–26px | Mono or sans per HTML | `font-variant-numeric: tabular-nums` |
| Meta / filters | 10–11px | Mono | Uppercase labels use `letter-spacing: 0.04em` |
| KPI labels | 11–12px | Sans | `--text-tertiary` |

**Rule:** Anything numeric in a table or stat row should be mono + tabular nums.

---

## 5. App shell (every dashboard route)

```
.app                          grid: sidebar | main
  .sidebar                     232px (56px collapsed)
  .main                        flex column
    .topbar                    44px — crumb, bands, search, CTA
    .page                      flex 1, padding 20px 28px 40px
      {page content}
```

**Files:** `components/dashboard/dashboard-shell.tsx`, `nav.tsx`, `dashboard-topbar.tsx`

### Topbar
- Breadcrumb: `Workspace / {Page}` via `.crumb`
- Band pills: HOT / WARM / COLD counts (hidden on some pages if HTML omits them)
- Primary CTA: **Score account** → `/score` (not generic “New” unless page-specific)
- Buttons: `.tb-btn`, `.tb-btn.outlined`, `.btn-primary`

### Sidebar
- Groups: **Workspace**, **Lists**, credits block, user row
- Active item: `.sb-item.active`
- Badges: `Soon` for unreleased features, `Beta` for experimental (see `comingSoon` / `beta` on nav items)

### Page padding
- Default: `.page` with standard padding
- **Full-bleed pages** (e.g. two-pane Autopilot): use `.page.page-flush` — no padding, `overflow: hidden`, child fills height
- **History-style:** root wrapper is page-specific (e.g. `.hist-page`) — do not nest `.page` twice

---

## 6. Implementation patterns for agents

### 6.1 CSS layering (critical)

Tailwind v4 can override unscoped CSS. Follow this order:

1. Put page-specific rules in `@layer components { ... }` in `globals.css`
2. For **layout-critical** grid/flex/height, also set **`style={{ ... }}`** on the root wrapper (see `history-view.tsx` `S` constants pattern)
3. **Scope conflicting class names** under a parent:
   - Dashboard Autopilot canvas: `.ap-shell .ap-flow`, `.ap-shell .ap-canvas`
   - Landing preview canvas: `.autopilot-canvas .ap-flow`
   - Never share bare `.ap-canvas` / `.ap-flow` between landing and dashboard

### 6.2 Page architecture

```tsx
// Server page — data only
app/(dashboard)/{route}/page.tsx

// Client view — layout + interaction
app/(dashboard)/{route}/{route}-view.tsx
```

- Server component: auth, Supabase fetch, pass props
- Client component: tabs, drawers, filters, inline edit
- Prefer **semantic HTML classes from reference** over shadcn `Card` / `Table`

### 6.3 When to use shadcn vs custom

| Use shadcn | Use HTML/CSS tokens |
|------------|---------------------|
| Dialogs, dropdowns, tooltips (if needed) | Page layout, tables, KPI strips |
| Form controls inside modals | Topbar, sidebar, band pills |
| Legacy pages not yet ported | All new dashboard page ports |

Do not wrap ported sections in shadcn `Card` unless the HTML explicitly shows a `.card`.

### 6.4 Data tables & lists

- Header row: uppercase 11px labels, `--text-tertiary`
- Rows: 13px, border `--border-subtle`, hover `rgba(255,255,255,0.02)`
- Score columns: mono + band chip
- Signal pills: short codes (FU, HI, NE, TE, WE) with reference colors

### 6.5 Empty & coming-soon states

- **Coming soon:** centered column, icon in tinted square, `.page-title`, badge, short note, link back (see `/autopilot`)
- Nav: `comingSoon: true` → **Soon** pill in sidebar
- Do not expose half-finished flows in nav CTAs or dashboard cards

---

## 7. Page prefix conventions

| Prefix | Page | Notes |
|--------|------|-------|
| `.hist-*` | History | Activity chart, date groups, drawer |
| `.ap-*` (dashboard) | Autopilot | Two-pane shell, flow nodes, tokens — scoped under `.ap-shell` |
| `.ap-*` (landing) | Landing autopilot mock | Horizontal flow — scoped under `.autopilot-canvas` |
| `.card`, `.kpi`, `.grid-*` | Dashboard home | Shared dashboard primitives |

When adding a new major page, **use a unique prefix** (e.g. `.scr-*` for Score) inside `@layer components` to avoid collisions.

---

## 8. Launch scope (v1)

**Ship-ready surfaces:** Dashboard, Score, History, People, Watchlist, Billing, API keys (keys may show Soon), Landing, Auth.

**Gated / Soon:** Autopilot (workflows UI exists but `/autopilot` shows coming-soon; APIs remain for future).

**Principle:** Prefer a polished **Soon** state over a broken partial port.

---

## 9. Anti-patterns (do not do this)

- Default shadcn card grid for new dashboard pages
- Hardcoded colors outside token variables
- Shared `.ap-flow` / `.ap-canvas` without parent scope (breaks landing vs dashboard)
- `ANY` / logic keywords in user-facing workflow descriptions — use ` · ` separators like HTML
- Double `.page` padding (wrapper + inner padded container)
- Introducing a second brand hue — there is exactly one accent, `--brand`
- Emoji as icons — use Lucide or inline SVG from HTML references
- Removing band semantics (HOT/WARM/COLD) from score UI

---

## 10. Checklist before marking a page “done”

- [ ] Visually compared side-by-side with matching `IntentIQ *.html`
- [ ] Tokens only (no stray hex except in SVG/chart fills from reference)
- [ ] Shell: sidebar + topbar unchanged except route-specific crumbs/CTAs
- [ ] Typography: 13px dashboard, mono for data
- [ ] CSS in `@layer components`; layout-critical inline styles if Tailwind fights you
- [ ] Real API data wired where HTML shows dynamic values
- [ ] `npm run build` passes
- [ ] Responsive: check reference `@media` breakpoints if present

---

## 11. Related files

| File | Purpose |
|------|---------|
| `app/globals.css` | Tokens + all ported `@layer components` CSS |
| `components/dashboard/dashboard-shell.tsx` | App grid shell |
| `components/dashboard/nav.tsx` | Sidebar IA + Soon/Beta badges |
| `components/dashboard/dashboard-topbar.tsx` | Topbar |
| `components/landing/LandingPage.tsx` | Marketing page |
| `.cursor/plans/html-design-port.md` | Original port plan (historical) |
| `CLAUDE.md` | Product/architecture context (not visual spec) |

---

## 12. One-line summary for agents

> **Match the HTML prototype, use CSS tokens and semantic classes, scope page CSS to avoid Tailwind collisions, split server page + client view, and gate unfinished features as Coming soon.**
