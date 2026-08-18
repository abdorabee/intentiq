# VesperWise → "Claude" Redesign Prompt

This document is a **copy-paste-ready prompt** for redesigning VesperWise's UI toward the
**Claude / Anthropic design aesthetic** — warm, editorial, calm, and humane — as an alternative
to today's dark, Linear-inspired, acid-lime look.

- **How to use:** paste everything inside the `PROMPT` block below into Claude Code (or your
  AI design tool of choice) at the repo root. It is self-contained.
- **Companion doc:** pair it with [`YC-UX-TEARDOWN.md`](./YC-UX-TEARDOWN.md); the UX fixes there
  (activation, IA, honesty, monetization) should be applied *alongside* this visual re-skin.
- **Scope note:** this is a **visual/interaction re-skin + token unification**, not a backend
  change. Do not alter scoring, billing, or API logic.

---

## Quick reference: token mapping (today → Claude)

| Role | Today (dark/lime) | Claude (light, primary) | Claude (warm-dark, optional) |
|------|-------------------|-------------------------|------------------------------|
| App background | `#08090a` / `#000` | `#FAF9F5` (ivory) | `#262624` (warm charcoal) |
| Elevated surface / card | `#0e1011` | `#FFFFFF` | `#30302E` |
| Nested surface | `#131517` | `#F0EEE6` (oat) | `#3A3A37` |
| Primary text (ink) | `#f7f8f8` | `#1F1E1D` | `#F5F4EE` |
| Secondary text | `#b4bbc8` | `#54524D` | `#C2C0B6` |
| Tertiary/meta | `#8a8f98` | `#78756E` | `#908D84` |
| **Brand / primary action** | `#dfff00` (acid-lime) | **`#C15F3C` (Claude clay)** | `#D97757` (clay, lifted) |
| Brand hover | `#e8ff40` | `#A84E30` | `#E08A6B` |
| Brand tint (bg) | `rgba(223,255,0,.12)` | `#F5E6DE` | `rgba(217,119,87,.16)` |
| Focus ring | `#e8ff40` | `#C15F3C` @ 45% | `#D97757` @ 55% |
| Border | `rgba(255,255,255,.08)` | `#E5E2D9` | `rgba(255,255,255,.10)` |
| Border strong | `rgba(255,255,255,.13)` | `#D6D2C6` | `rgba(255,255,255,.16)` |
| **HOT band** | `#4ade80` | `#3E7A55` (deep leaf) | `#6FBF8B` |
| **WARM band** | `#f5b544` | `#C98A2B` (ochre) | `#E4B15A` |
| **COLD band** | `#8a8f98` | `#8A8478` (stone) | `#A3A093` |
| Data / numerics font | JetBrains Mono | keep mono (warm-tuned) | keep mono |
| Display / headings | Inter | **serif** (Tiempos/Fraunces/Georgia) | same |
| Body / UI | Inter | humanist sans (Inter/Styrene-like) | same |

The clay `#C15F3C` on ivory `#FAF9F5` is ~4.9:1 (AA for text) and excellent as a **fill with
`#FFFFFF` text** (~4.6:1 — use for buttons ≥16px/semibold; darken to `#A84E30` for small text).
All band colors above are chosen to pass AA on both ivory and white.

---

## PROMPT (copy everything below this line)

```text
You are redesigning the UI of an existing Next.js 16 (App Router, React 19) B2B SaaS called
VesperWise. It is a sales-intelligence app that scores companies 0–100 on purchase intent from
cited evidence (funding, hiring, news, tech change) and shows AI reasoning + a next action.
It uses Tailwind CSS v4, shadcn/ui, Recharts, and Lucide icons. Design tokens live in
`app/globals.css` (a `:root` block, a `.dark` block, plus `theme-overrides.css`), and dashboard
pages use semantic CSS classes in `@layer components` mirroring static HTML prototypes.

GOAL
Re-skin the entire product from its current dark, Linear-inspired, acid-lime (#dfff00 on #08090a)
look into the "Claude" / Anthropic aesthetic: warm, editorial, calm, and humane — WITHOUT changing
any backend, scoring, billing, or API behavior, and WITHOUT reducing the product's data density or
the meaning of its HOT/WARM/COLD intent bands. Light mode is the primary target; provide a warm-dark
variant as an optional theme.

DESIGN PRINCIPLES (the "Claude" feel)
1. Warm paper, not cold black. Backgrounds are ivory/cream (#FAF9F5) with white cards; surfaces feel
   like high-quality paper. Never pure #000 or pure #FFF page backgrounds.
2. One confident warm accent. The Anthropic "clay/terracotta" (#C15F3C) is the single primary action
   and highlight color. Use it sparingly and intentionally — it should feel special, not neon.
   Retire acid-lime entirely as a brand color.
3. Editorial typography. Use a serif for display/headings (calm, book-like authority) and a clean
   humanist sans for UI/body. Keep a monospace ONLY for numerics/data (scores, deltas, domains,
   counts) with tabular-nums. Generous line-height and measure; let headings breathe.
4. Calm, generous space. Increase whitespace and vertical rhythm vs. today's tight Linear chrome,
   but keep tables and stat rows information-dense — "roomy shell, dense data."
5. Soft, quiet depth. Hairline warm borders (#E5E2D9) and very soft shadows instead of glass/blur.
   Rounded-but-restrained radii (8–14px). No heavy neon glows, scanlines, or backdrop-blur glass.
6. Humane, plain language. Buttons and empty states speak like a helpful person, not a dashboard.
7. Accessibility first. All text ≥ WCAG AA. Never rely on color alone for band meaning — pair with
   a label/dot/icon. Visible focus rings on every interactive control.

CANONICAL TOKENS (define once; delete competing/duplicate definitions)
Create a single source of truth in app/globals.css :root (light) and .theme-warm-dark (optional dark).
Replace ALL hardcoded #dfff00 / #08090a / #000 / #fff usages in .tsx and .css with these vars.

Light (primary):
  --bg: #FAF9F5;            /* app background / canvas */
  --surface: #FFFFFF;       /* cards, panes, inputs */
  --surface-2: #F0EEE6;     /* nested panels, pills, table zebra */
  --text-primary: #1F1E1D;
  --text-secondary: #54524D;
  --text-tertiary: #78756E;
  --text-quaternary: #97938A;
  --border: #E5E2D9;
  --border-strong: #D6D2C6;
  --border-subtle: #EFEDE4;
  --brand: #C15F3C;         /* clay — primary actions, links, key accents */
  --brand-hover: #A84E30;
  --brand-contrast: #FFFFFF;/* text/icon on brand fill */
  --brand-tint: #F5E6DE;    /* subtle brand background */
  --ring: rgba(193,95,60,0.45);
  --hot: #3E7A55; --hot-bg: #E7F0E9; --hot-border: #BFD6C6;
  --warm:#C98A2B; --warm-bg:#F6EAD3; --warm-border:#E4CE9C;
  --cold:#8A8478; --cold-bg:#EFEDE6; --cold-border:#D8D3C7;
  --font-serif: "Tiempos Text", "Fraunces", Georgia, "Times New Roman", serif;  /* display */
  --font-sans: Inter, "Styrene B", ui-sans-serif, system-ui, sans-serif;        /* UI/body */
  --font-mono: "JetBrains Mono", ui-monospace, monospace;                       /* data only */
  --r-sm:6px; --r-md:8px; --r-lg:12px; --r-xl:14px;
  --shadow-sm: 0 1px 2px rgba(31,30,29,0.05);
  --shadow-md: 0 4px 16px rgba(31,30,29,0.07);

Warm-dark (optional, class .theme-warm-dark):
  --bg:#262624; --surface:#30302E; --surface-2:#3A3A37;
  --text-primary:#F5F4EE; --text-secondary:#C2C0B6; --text-tertiary:#908D84; --text-quaternary:#726F67;
  --border:rgba(255,255,255,0.10); --border-strong:rgba(255,255,255,0.16); --border-subtle:rgba(255,255,255,0.06);
  --brand:#D97757; --brand-hover:#E08A6B; --brand-contrast:#211E1C; --brand-tint:rgba(217,119,87,0.16);
  --ring:rgba(217,119,87,0.55);
  --hot:#6FBF8B; --hot-bg:rgba(111,191,139,0.14); --hot-border:rgba(111,191,139,0.35);
  --warm:#E4B15A; --warm-bg:rgba(228,177,90,0.14); --warm-border:rgba(228,177,90,0.35);
  --cold:#A3A093; --cold-bg:rgba(163,160,147,0.12); --cold-border:rgba(163,160,147,0.30);

TYPOGRAPHY RULES
- Page titles / marketing headlines: serif (--font-serif), large, tight leading, warm ink.
- Section labels / eyebrows: sans, 11–12px, uppercase, letter-spacing 0.04em, --text-tertiary.
- Body / UI: sans (--font-sans), 14–16px marketing, 13–14px dashboard, line-height ~1.5.
- Numerics in tables/stats/scores: --font-mono, font-variant-numeric: tabular-nums. Keep this rule.
- Do NOT set serif on data tables or buttons — serif is for display/prose only.

COMPONENT DIRECTION (apply across the app)
- App shell (components/dashboard/dashboard-shell.tsx, nav.tsx, dashboard-topbar.tsx):
  ivory canvas, white sidebar with hairline --border, active nav item = --brand-tint bg + --brand
  left-accent + ink text. Replace neon/glass with flat warm surfaces. Slightly increase sidebar and
  topbar padding for a calmer feel; keep 232px sidebar width.
- Buttons (components/ui/button.tsx + .btn-primary): primary = solid --brand fill, --brand-contrast
  text, radius --r-md, subtle --shadow-sm, hover --brand-hover (no translate/scale gimmicks).
  Secondary = white surface + --border-strong + ink text. Remove the acid-lime and the pill/full-round
  default; use --r-md. Fix the existing bug where .btn-primary consumes a translucent --accent tint.
- Score result (app/(dashboard)/score/score-view.tsx and components/score/score-result.tsx):
  this is the hero moment. Score ring uses band color stroke on a white card; large serif score number
  is acceptable OR mono — pick mono for consistency with data. Show: band chip, four trigger axes,
  per-signal status (ok/stale/unavailable), evidence links, freshness ("scored 2h ago"), and the AI
  verdict + next action in a calm, readable prose block (sans, generous leading). Keep it dense but airy.
- Bands: keep HOT/WARM/COLD semantics and copy. Render as .band chips = band-bg fill + band-border +
  band-colored dot + band-colored label. Never use --brand (clay) for a band. Ensure a dot/label so
  meaning survives grayscale/color-blindness.
- Tables/lists (watchlist, history, pipeline, bulk, lists): white surface, hairline row separators
  (--border-subtle), 11px uppercase --text-tertiary headers, 13–14px rows, mono for score/delta/domain
  columns, hover = --surface-2. Keep density; just warm the palette and soften separators.
- Charts (Recharts / signal-mix donut / distribution): use a warm categorical palette derived from
  band + brand + muted ochres/olives; area fills at low opacity on ivory; grid lines --border-subtle.
  Avoid neon greens/magentas.
- Empty & loading states: warm, friendly. Add skeletons using --surface-2 shimmer and role="status"/
  aria-live="polite". Empty states use a small clay-tinted icon tile, serif title, one-line plain-language
  hint, and a clear primary action (e.g. "Score your first account").
- Inputs/dialogs/badges (components/ui/*): white/oat surfaces, --border, --r-md/--r-lg, clay focus ring,
  remove heavy blur/glass. Keep 16px input font on mobile to prevent iOS zoom.
- Landing (components/landing/LandingPage.tsx): ivory hero, serif headline with a single clay-accented
  phrase (replace the lime gradient), calm product screenshot on a soft card, generous whitespace,
  clay primary CTA. Keep it editorial and confident, not neon.

GUARDRAILS
- Do not change scoring math, credit/billing logic, API routes, auth, or data fetching.
- Put page CSS in @layer components in app/globals.css; for layout-critical grid/flex use inline styles
  as the existing code does. Keep semantic class names from the HTML prototypes.
- Eliminate the current token chaos: there must be exactly ONE definition each of --brand, --accent,
  .band, and .btn-primary. Remove/rename the conflicting --iq-*, cyan-as-lime, and Apple-layer radii
  overrides so components stop drifting from the tokens.
- Replace hardcoded hex in .tsx/.css with the tokens above. Grep for "#dfff00", "#08090a", "#000",
  "#fff", "rgba(223,255,0" and convert them.
- Provide a light/dark toggle via next-themes; light is default. Ensure both themes pass the acceptance
  criteria below.

DELIVERABLES
1. Updated app/globals.css (+ theme-overrides.css) with the unified token system (light + warm-dark).
2. Updated shared components (button, badge, card, input, dialog, table primitives, dashboard shell,
   nav, topbar) to consume tokens.
3. Re-skinned key surfaces: /score (result), dashboard home, one data table page (watchlist), billing,
   and the landing hero — as the pattern for the rest.
4. A short design-reference/CLAUDE-THEME.md documenting the final tokens and usage rules.
5. `npm run lint` and `npm run build` pass; no hardcoded brand hex remains in changed files.

ACCEPTANCE CRITERIA (per surface)
- Global: no acid-lime anywhere; page backgrounds are warm (never #000/#FFF); one clay accent used
  sparingly; serif used for display, sans for UI, mono for all numerics.
- Contrast: primary text ≥ 7:1, secondary ≥ 4.5:1, tertiary ≥ 4.5:1 (large ≥ 3:1), band colors ≥ 3:1
  on their backgrounds, clay buttons ≥ 4.5:1 with white text at used sizes. Verify light AND warm-dark.
- Bands: HOT/WARM/COLD still instantly distinguishable AND legible in grayscale (dot + label present).
- Score result: score, band, four triggers, per-signal status, evidence, freshness, and next action all
  visible on one calm card; feels trustworthy and editorial.
- Focus: every interactive element shows a visible clay focus ring; keyboard nav works.
- Mobile (≤640px): band chips remain visible somewhere on screen; tap targets ≥44px; inputs 16px.
- Density preserved: tables/stat rows are no less information-dense than today, just warmer and softer.

Work surface-by-surface. After each surface, show a brief before/after description and confirm the
acceptance criteria for that surface before moving on.
```

---

## Optional add-ons you can append to the prompt

- **"Also produce a one-screen style tile"**: ask the tool to build a `/style` (or Storybook-less)
  demo page that renders the token swatches, buttons, band chips, a score ring, and a sample table so
  you can screenshot the new system for your YC application.
- **"Keep a feature flag"**: ask it to gate the new theme behind `NEXT_PUBLIC_THEME=claude` so you can
  A/B the lime vs. clay look with investors before committing.
- **Reference imagery**: point the tool at Anthropic's own product surfaces (claude.ai) for the paper +
  clay + serif feel, and at this repo's `IntentIQ Linear.html` (the earlier violet direction) as proof
  the codebase already supports non-lime palettes.

---

*Rationale for the palette:* Anthropic's visual language is warm paper (ivory/oat), a single
terracotta/clay accent, humane serif-forward typography, and calm generous space — the opposite of
the current high-energy neon-on-black. Mapping VesperWise onto it keeps the product's genuine
strength (dense, trustworthy, evidence-first data) while making it feel considered and premium, which
reads as "design maturity" to investors. Crucially, the band semantics and mono numerics are preserved
so the core product language and data density survive the re-skin.
