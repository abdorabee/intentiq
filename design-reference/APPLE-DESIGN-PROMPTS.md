# VesperWise — Apple-Foundation Design Prompt Pack

**What this is:** a set of copy-paste prompts for Claude (design mode). Each one is written as a
product-owner brief: who the user is, what the surface must accomplish, the exact design system to
obey, the layout spec, the states, and the acceptance criteria.

**How to use it**

1. **Always paste `PROMPT 00 — FOUNDATION` first, in every new chat.** It is the design system. Every
   other prompt assumes it is already in context.
2. Then paste **one section prompt per chat**. Do not batch them — quality collapses when a single
   chat has to hold six surfaces.
3. Ask for **one high-fidelity HTML+CSS mock** per prompt (dark by default), using CSS variables only.
   That output ports into `app/globals.css` under `@layer components` with near-zero translation loss.
4. Iterate on **one component at a time**. "Redo the score ring" beats "polish the page."

**Build order (recommended):** 00 → 01 Landing → 05 Shell → 07 Intent Hub → 08 Score → 06 Home →
then the rest → finish with 20 Cross-cutting states and 21 Investor pass.

---

## Reading the business first (context every prompt assumes)

**VesperWise** is B2B pipeline intelligence. It scores companies 0–100 on *buying intent* from live
external signals, explains the score in plain English, and tells the rep what to do next.

- **Signals:** funding, hiring, news, technology, web activity, GitHub — fetched in parallel,
  weighted, and decayed over time (fresh signal counts more).
- **Bands:** `HOT ≥ 75` · `WARM ≥ 50` · `COLD < 50`. This is the product's core language.
- **Economy:** credits. 1 credit = 1 account scored. Plans: free / starter / growth / pro / agency,
  plus one-time top-ups. Credits are the scarcity the whole UI orbits.
- **Buyer:** a B2B AE, SDR, or founder-led sales team. They live in a CRM all day and are allergic to
  dashboards that tell them nothing they can act on.
- **The emotional promise:** *"Stop guessing which account to call. Here are the four, ranked, with
  the reason and the opening line."*

**Surfaces:** Landing + marketing · Auth · Onboarding · Dashboard home · Intent Hub · Score ·
People · Watchlist · Lists · Bulk Score · History · Inbox · Memory (ICP) · Autopilot (gated) ·
Billing · API Keys · Settings.

---

# PROMPT 00 — FOUNDATION

> Paste this at the top of every design chat.

```
You are the principal product designer for VesperWise, a B2B pipeline-intelligence platform. It
scores companies 0–100 on buying intent from live signals (funding, hiring, news, technology, web
activity, GitHub), explains each score in plain English, and recommends the next action. Users are
B2B account executives and founder-led sales teams. Every account scored costs the user 1 credit.

I want you to design at the level of Apple's product surfaces — but applied to a dark, data-dense
SaaS product, not copied literally. Apply the FOUNDATIONS below, not Apple's photography-led
marketing look, unless I explicitly say "marketing surface."

## APPLE FOUNDATIONS TO APPLY

1. Deference. The interface recedes so the data can speak. No decorative chrome, no gradient
   backgrounds, no glow, no glass unless it is functionally a floating layer over content.
2. One accent. Exactly one interactive color signals "this is actionable." Everything else is
   surface, ink, or hairline. Never introduce a second brand color.
3. Clarity through hierarchy, not decoration. When a section needs emphasis, change the surface
   tone or the type scale — never add a border, shadow, or glow to get attention.
4. Shadow is rare and meaningful. One elevation treatment, used only for true floating layers
   (modals, popovers, command palette, sticky bars). Never on cards, buttons, rows, or text.
5. Typographic discipline. A fixed ladder of sizes and weights. Negative letter-spacing at display
   sizes. Weight 500 does not exist: the ladder is 400 / 600 / 700.
6. Spatial rhythm. An 8px base grid. Whitespace is the pedestal — content gets air above and below
   before it gets a container.
7. Depth through state, not ornament. Press = transform: scale(0.97). Focus = a 2px accent ring.
   Hover on dark = a 2% white wash. That's the entire interaction vocabulary.
8. Touch targets minimum 44x44px on anything a finger can reach; 32px minimum for precision
   desktop-only controls.
9. Motion is functional. 120–200ms, ease-out, opacity + 2–4px translate. Nothing bounces, nothing
   spins decoratively. Respect prefers-reduced-motion.

## LOCKED VISUAL IDENTITY — do not change these values

Surfaces (dark is the product default):
  --bg              #08090a   app canvas
  --bg-elevated     #0e1011   cards, panes, inputs, rows
  --surface         #131517   nested panels, pills, popovers
  --sidebar         #0a0b0d   sidebar canvas

Ink:
  --text-primary    #f7f8f8   headings, values
  --text-secondary  #b4bbc8   body
  --text-tertiary   #8a8f98   labels, placeholders
  --text-quaternary rgba(247,248,248,0.45)  meta, hints

Hairlines:
  --border          rgba(255,255,255,0.08)
  --border-strong   rgba(255,255,255,0.13)
  --border-subtle   rgba(255,255,255,0.04)

The single accent — acid lime:
  --accent          #dfff00   ALL interactive intent: primary buttons, links, focus rings,
                              active nav, selected state, progress fill
  --accent-2        #e8ff40   hover/lighter step only
  CRITICAL: text on an --accent fill is --bg (#08090a), never white. White on lime is unreadable.
  Use lime as a fill sparingly — it is loud. Most of the time it is a 1–2px indicator, an active
  underline, a dot, or 13px link text.

Intent bands — SEMANTIC ONLY, never decorative, never used for anything but band meaning:
  --hot   #4ade80   green   high intent
  --warm  #f5b544   amber   moderate intent
  --cold  #8a8f98   grey    low intent
  Band rendering is always: small filled dot + uppercase mono label. Never a full colored card,
  never a colored background fill behind a whole row.

Radii: --r-sm 4px · --r-md 6px · --r-lg 8px · --r-xl 12px. Nothing in between. No pills except
tiny status chips and the search input.

Type:
  Sans: Inter (variable). Mono: JetBrains Mono.
  RULE: anything numeric that appears in a table, stat, score, delta, count, or timestamp is
  mono + font-variant-numeric: tabular-nums. Always. Domains and IDs are mono too.

Type ladder (app surfaces):
  page title        22px / 600 / -0.02em / sans
  section head      15px / 600 / -0.01em / sans
  body / table row  13px / 400 / -0.006em / sans   <- the app's default size
  label             12px / 500 / --text-tertiary
  uppercase meta    11px / 500 / 0.04em / mono / --text-tertiary
  micro             10px / 500 / 0.04em / mono
  stat value        18–26px / 600 / mono / tabular-nums
  hero score        44–64px / 600 / mono / -0.03em / tabular-nums

Type ladder (marketing surfaces):
  hero h1  56px / 600 / 1.07 / -0.03em   (40px @1068, 34px @640, 28px @420)
  h2       40px / 600 / 1.1 / -0.02em
  lead     20px / 400 / 1.5 / --text-secondary
  body     16px / 400 / 1.5
  eyebrow  11px / 500 / 0.08em / uppercase / mono / --accent

Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · 80. Structural layout snaps to 8.
  App page padding: 20px 28px 40px. Card padding: 16–20px. Marketing section padding: 80–120px.

Elevation — the ONLY shadow in the system:
  --shadow-float: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
  Used exclusively on: modals, dropdowns, command palette, drawers, toasts, sticky bars.
  Never on cards, table rows, buttons, KPI tiles, or nav items.

States:
  hover (dark)  background rgba(255,255,255,0.02–0.04)
  active/press  transform: scale(0.97)
  focus         outline: 2px solid var(--accent); outline-offset: 2px
  selected      1px left border in --accent + rgba(223,255,0,0.06) wash
  disabled      opacity 0.4, cursor not-allowed

## HARD RULES

- Tokens only. No hardcoded hex outside chart/SVG fills.
- No glassmorphism, no neon glow, no gradient backgrounds, no emoji as icons. Icons are Lucide,
  1.5px stroke, 14–16px in app chrome, 20px in marketing.
- Never use lime for band meaning. Never use band colors for CTAs.
- Data-dense does not mean cramped: 32–36px row height in tables, 13px text, generous left gutter.
- Every screen must answer "what do I do next?" above the fold.
- Design light mode as a genuine second theme (invert surfaces, keep the same accent and bands),
  never as an afterthought.

## DELIVERABLE FORMAT (unless I say otherwise)

One self-contained HTML file with inline <style>, using CSS custom properties declared in :root
exactly as named above, plus @layer-style component classes with a page-specific class prefix so
the CSS can be pasted into a Tailwind v4 codebase without collisions. Include realistic B2B sample
data (real-sounding company names, plausible funding rounds, real-shaped timestamps) — never
"Lorem ipsum" and never placeholder greys. Show default, hover, empty, and loading states for the
key component of the screen.

Confirm you have absorbed this system, then wait for my screen brief.
```

---

# PROMPT 01 — LANDING PAGE (the investor's first 8 seconds)

```
SURFACE: / — the marketing landing page. This is a MARKETING surface: use the full Apple
tile-rhythm language here (edge-to-edge sections, alternating surface tone as the only divider,
generous whitespace, one idea per screen).

AUDIENCE: two at once. (1) A B2B sales leader deciding whether this replaces their guesswork.
(2) A seed/Series-A investor deciding in 8 seconds whether this team can build a premium product.
The page must read like a company with a design team, not a solo project.

CURRENT STATE: dark hero with a gradient headline, an embedded product mock of the dashboard, a
logo trust strip, three feature sections (Score / Intent Hub / Autopilot), stats, pricing, API,
footer. The bones are right. The execution is generic: too many competing accents, section
boundaries drawn with borders, and product mocks that shrink the product instead of celebrating it.

REDESIGN BRIEF — section by section:

1. TOP BANNER (44px). Announcement strip: lime "NEW" micro-pill, one sentence, arrow. Dismissible.
   No border-bottom — separate it with a one-step surface change only.

2. GLOBAL NAV (56px, sticky). Left: VesperWise wordmark. Center: Product · Intent Hub · Autopilot ·
   Pricing · Docs (13px, --text-secondary). Right: "Sign in" text link + "Start free" primary
   button (lime fill, #08090a text, --r-md, 36px tall). On scroll past 40px the nav gains
   backdrop-filter: saturate(180%) blur(20px) over rgba(8,9,10,0.72) and a --border-subtle
   hairline. Collapses to hamburger at 834px.

3. HERO (min-height 88vh, centered, one idea only).
   - Eyebrow: lime dot + "Spring '26 — People scoring + warm-account routing →"
   - H1, two lines, 56px/600/-0.03em: "Stop guessing which account to call."
     Second line in --text-tertiary: "Score every one of them, 0 to 100."
   - Lead, 20px, max-width 620px, --text-secondary: live signals, AI reasoning, and the next move.
   - Two CTAs: primary "Start scoring free" (lime) + ghost "See a live score" (transparent, 1px
     --border-strong). 44px tall, --r-md. Below them, 12px --text-quaternary: "No credit card ·
     25 free credits."
   - Background: --bg with a very subtle dot-grid (rgba(255,255,255,0.03), 32px pitch) fading out
     with a radial mask. NO gradient orbs, NO glow.
   - Below the fold-line, the hero product shot: a single, large, pixel-accurate render of the
     Intent Hub board — full-bleed to 1200px, --r-xl, 1px --border, and THE one shadow in the
     system. This is the "product resting on a surface" moment. Give it 64px of air above.

4. TRUST STRIP. "Trusted by revenue teams at" in 11px uppercase mono --text-tertiary, then 5–6
   wordmarks at 40% opacity, greyscale, rising to 70% on hover. No box, no border, 48px padding.

5. SECTION: THE SCORE. Eyebrow "The Score" → H2 "A 0–100 number your AE doesn't have to
   interpret." → two-column: left is 3 stacked explanation beats (Explainable signals /
   Time-decayed freshness / A summary you'd paste to your boss), right is a large, real score-detail
   panel mock showing the ring, band, four trigger rows with dates and sources, and the AI thesis.
   The mock must be legible at 100% — if the text needs squinting, scale up and crop instead.

6. SECTION: INTENT HUB (surface flips to --bg-elevated, no border — the tone change IS the divider).
   H2 "Your pipeline, ranked by buying intent — not last touch." Full-width board mock: HOT / WARM /
   COLD columns with real company cards. Add one caption line under it in 13px --text-tertiary
   explaining what changed since yesterday.

7. SECTION: AUTOPILOT (back to --bg). H2 "Workflows that fire while the buying window is open."
   Horizontal flow: trigger node → condition node → action nodes. Lime connector lines at 1px.
   Mark it with a "Coming soon" chip — honesty reads as confidence.

8. PROOF STATS. Three numbers in 40px mono tabular-nums with 11px uppercase mono labels beneath.
   Accounts scored · Median time to first HOT · Signal sources. No cards, no borders — just air.

9. PRICING. Four plan columns (Free / Starter / Growth / Pro) + an "Agency — talk to us" row.
   Growth is the anchor: 1px --accent border, a small lime "Most popular" chip, and NO other
   visual difference. Price in 34px mono. Feature lists 13px with 14px lime check icons. Monthly/
   annual toggle at the top. Add a one-line credit explainer: "1 credit = 1 account scored."

10. API SECTION. A single dark code block (--surface, --r-lg, mono 13px) showing a POST to
    /v1/score and the JSON response with score, band, signals, summary. Syntax highlighting uses
    --text-secondary + one lime for strings. Beside it: three bullets (REST, 24h cache, bulk to
    1,000). This section is for the technical evaluator and the investor's technical DD.

11. FINAL CTA. Full-bleed, centered, 120px padding: H2 "See what your pipeline actually looks
    like." + primary CTA + the no-credit-card line.

12. FOOTER. Four link columns (Product / Company / Developers / Legal) with 14px column headings
    at 600 and relaxed 2.2 line-height link lists at 13px. Bottom legal row 11px
    --text-quaternary, status dot ("All systems operational"), and the wordmark.

ACCEPTANCE CRITERIA
- A stranger understands what this does within 5 seconds of the H1 + lead.
- Exactly one accent color appears anywhere on the page.
- Every section boundary is a surface-tone change, not a border.
- No section has more than one primary CTA.
- Product mocks are large and legible, never decorative miniatures.
- Passes at 1440 / 1068 / 834 / 640 / 420px; hero h1 steps 56 → 40 → 34 → 28.
```

---

# PROMPT 02 — MARKETING SUB-PAGES (About · Docs · Contact · Legal/Security/DPA)

```
SURFACES: /about, /docs, /contact, /legal/security, /legal/dpa, /privacy, /terms.
These are the pages investors and enterprise buyers actually open after the landing page. Today
they are the weakest link — they must feel like the same company built them.

SHARED CHASSIS: same global nav and footer as the landing page. Content column max-width 720px for
prose, 980px for docs with a sidebar. Section padding 80px. Marketing type ladder.

1. /about — "Why we built this."
   Hero: eyebrow "About" → H1 40px → 20px lead. Then a 3-beat narrative (the problem with
   last-touch attribution / what changed in signal availability / what we're building toward).
   Add a "Principles" trio: Explainable over magical · Fresh over comprehensive · Action over
   analytics — each 15px/600 heading + 2-line 15px body, laid out in three columns, no cards.
   Close with a founder note in --text-secondary and a CTA. No stock photos. If there are no team
   photos yet, use type and whitespace — an empty avatar grid looks worse than none.

2. /docs — developer documentation.
   Two-column: 240px sticky left nav (grouped: Getting started / Scoring / Endpoints / Webhooks /
   Errors / Rate limits) + content column. Active nav item = lime left-border + --text-primary.
   Code blocks: --surface, --r-lg, 13px mono, language chip top-right, copy button on hover.
   Endpoint headers: mono METHOD chip (green POST / blue GET) + monospace path.
   Parameter tables: 13px, mono for the param name, "required" in 10px uppercase mono lime.
   Include a full worked example: request → response → what each field means → what the score
   means. An "On this page" right rail at ≥1280px.

3. /contact — sales and support.
   Split layout: left is a 3-field form (name / work email / message) with a subject selector
   (Sales · Support · Security · Press); right is a stack of direct routes — email addresses,
   expected response time, and a security-disclosure line. Form fields: --bg-elevated, 1px
   --border, --r-md, 44px tall, label above at 12px, focus = lime ring. Success state replaces the
   form in place with a lime check and a "we reply within one business day" line — never a toast.

4. /legal/security — the enterprise-buyer page.
   Structured, scannable, confident: a control grid (Encryption in transit & at rest · Access
   control · Data retention · Subprocessors · Incident response · Vulnerability disclosure). Each
   is a 15px/600 heading + 2–3 lines of plain English. Add a subprocessor table (13px, mono for
   the purpose column). Do not invent certifications you don't hold — state current posture
   honestly and mark roadmap items as roadmap. Honest specifics read as more credible than badges.

5. /legal/dpa, /privacy, /terms — long-form legal.
   Single 720px column, 16px/1.7 body, 15px/600 headings with generous 48px section spacing,
   numbered clauses in mono, a sticky "Last updated" chip, and an anchored table of contents at
   the top. Legal pages that are pleasant to read are a premium signal almost nobody bothers with.

ACCEPTANCE CRITERIA
- All five pages share one nav, one footer, one type ladder, one accent.
- Docs code blocks are copy-pasteable and syntax-consistent.
- Nothing on the security page overstates compliance posture.
```

---

# PROMPT 03 — AUTH (Sign in · Sign up · SSO callback)

```
SURFACES: /login, /signup, and their SSO callback states. Auth is powered by Clerk with a custom
dark theme — design the shell and specify the Clerk appearance variables.

PRINCIPLE: this is the highest-intent moment in the funnel. Zero friction, zero decoration, and one
piece of reassurance.

LAYOUT: split, 50/50 above 1024px; single column below.
- Left (form panel, --bg): centered 380px column. VesperWise wordmark at top (32px). H1 22px/600
  "Create your workspace" / "Welcome back". Sub-line 13px --text-tertiary. Then: Google SSO button
  (full width, 44px, --bg-elevated, 1px --border, --r-md, Google mark 16px) → an "or" divider
  (hairline + 11px uppercase mono --text-quaternary) → email + password fields → primary lime
  submit at 44px. Footer link line 13px: "Already have an account? Sign in" with the link in lime.
  Below that, 11px --text-quaternary legal line linking terms + privacy.
- Right (proof panel, --bg-elevated): NOT a decorative image. Put one real product artifact there —
  a static score-detail card for a recognizable company showing band, score, two triggers, and the
  one-line thesis — plus a single 15px customer-style line beneath it. The user should see the
  product before they've signed up.

FIELD SPEC: 44px tall, --bg-elevated, 1px --border, --r-md, 13px text, label 12px above at
--text-tertiary, placeholder --text-quaternary. Focus: 2px lime ring, offset 2px, border goes
transparent. Error: 1px #f87171 border + 12px error text below with a 14px alert icon — never a
red background fill. Password field has a show/hide eye toggle at 32px tap target.

STATES TO DESIGN
- Idle, focused, filled, error (bad credentials), loading (button label swaps to a 14px spinner,
  button stays lime, width does not change), rate-limited.
- SSO callback: a centered 280px column — lime pulse dot, "Completing sign-in…" 15px, and a
  --text-quaternary sub-line. This screen shows for under 2s so it must be calm, not a spinner-
  filled void. Include the failure variant with a "Try again" ghost button.

ACCEPTANCE CRITERIA
- Form is completable with the keyboard alone; visible focus ring at every step.
- No layout shift between idle and error states — reserve the error line's height.
- Signup asks for nothing beyond email + password. Everything else belongs in onboarding.
```

---

# PROMPT 04 — ONBOARDING WIZARD (the ICP capture)

```
SURFACE: /onboarding — runs once, immediately after signup. It captures the user's Ideal Customer
Profile, which powers ICP-fit scoring across the product (the "Memory" surface).

PRODUCT GOAL: get to the user's FIRST SCORED ACCOUNT in under 90 seconds. Every question must earn
its place by improving scoring quality. This is not a survey — it is the moment the product starts
knowing them.

STRUCTURE: full-screen, no sidebar, no topbar. Centered 560px column on --bg. A 3px-tall segmented
progress rail pinned at the very top of the viewport — filled segments in lime, upcoming in
--border. Step counter in 11px uppercase mono at the top-right of the column ("Step 2 of 4").

STEPS
1. "What do you sell?" — one large textarea (min 96px, 15px text, --bg-elevated, --r-lg) with a
   genuinely helpful placeholder showing a real example. Below it, 4 example chips the user can
   click to prefill.
2. "Who do you sell to?" — company size (segmented control), industry (multi-select chips, lime
   1px border when selected, filled dot), geography (multi-select chips).
3. "What signals matter most?" — the six signals as selectable cards in a 3x2 grid. Each card:
   16px Lucide icon, 13px/600 name, 12px --text-tertiary one-liner. Selected = 1px lime border +
   rgba(223,255,0,0.06) wash + a lime check in the top-right. This step directly explains how
   scoring works, so it doubles as education.
4. "Score your first account." — a single large domain input (48px, mono 15px, lime-ringed on
   focus) with a "example: stripe.com" hint and three suggested well-known domains as chips.
   Primary CTA: "Score it — 1 credit". Sub-line: "You have 25 free credits."

NAVIGATION: "Back" as a 13px ghost text button on the left; primary "Continue" on the right, 44px,
lime. Enter key advances. A 13px --text-quaternary "Skip for now" is available on steps 1–3 but NOT
on step 4 — the first score is the activation moment.

TRANSITIONS: steps cross-fade with a 12px horizontal slide, 180ms ease-out. The progress rail
animates its fill over 240ms.

FINAL STATE: do not show a "you're all set" celebration screen. Route straight into the running
score with the live progress indicator — the first score IS the reward. Design that handoff so it
feels continuous, not like a page change.

ACCEPTANCE CRITERIA
- Answering everything takes under 90 seconds.
- Nothing on any step is required except step 4's domain.
- The captured ICP is echoed back in plain English at the top of step 4 so the user sees it landed.
```

---

# PROMPT 05 — APP SHELL (Sidebar · Topbar · Command palette)

```
SURFACE: the persistent chrome behind every dashboard route. This is the single highest-leverage
design in the product — it is on screen 100% of the time, so its restraint sets the perceived
quality of everything else.

LAYOUT GRID: [sidebar 232px | main 1fr]. Sidebar collapses to 56px (icon-only). Main is a flex
column: topbar 44px, then the page area with 20px 28px 40px padding.

SIDEBAR (--sidebar #0a0b0d, 1px --border-subtle right edge)
- Workspace head (52px): 24px logo mark, workspace name 13px/600, second line 11px
  "Workspace · growth" in --text-tertiary, chevron at the right. Clicking opens a workspace popover
  (uses the one system shadow).
- Search trigger: full-width 32px row, --bg-elevated, --r-md, 14px search icon, "Search" at 13px
  --text-tertiary, and a right-aligned ⌘K kbd chip (10px mono, --surface, --r-sm, 1px --border).
- Section label "Workspace": 10px uppercase mono, 0.06em, --text-quaternary, 16px top margin.
- Nav items (30px tall, --r-md, 8px horizontal padding, 8px gap): 15px Lucide icon at
  --text-tertiary + 13px label at --text-secondary.
  · hover: rgba(255,255,255,0.03), icon and label step to --text-primary
  · active: rgba(255,255,255,0.06) + a 2px lime bar inset on the left edge + --text-primary label
    + lime icon. NOT a lime background fill.
  · count badge: right-aligned, 10px mono, --surface, --r-sm — for Inbox, Intent Hub HOT count,
    Watchlist.
  · "Soon" / "Beta" pills: 9px uppercase mono, --surface, --text-quaternary, --r-sm. Muted, so
    unreleased items don't compete.
  Items: Dashboard · Intent Hub (HOT count) · Score · History · People (Beta) · Watchlist · Lists ·
  Bulk Score · Autopilot (Soon) · Inbox (count).
- Credits block (pinned above the user row): 11px uppercase mono "Credits" label, then value in
  18px mono tabular-nums "1,240 / 2,000", then a 3px progress rail — lime fill, --border track,
  --r-sm. Below 15% remaining the fill turns --warm and a 12px "Top up" lime link appears. This
  is the one place scarcity is allowed to be visible.
- User row (48px, top hairline): 24px avatar (initials, 11px mono, --surface), name 13px, email
  11px --text-quaternary, and an overflow menu with Settings / Theme / Sign out.
- Bottom items: Billing, API Keys (Soon).
- Collapsed (56px): icons only, centered, with tooltips on the right at 150ms delay. The active
  lime left-bar persists. Toggle button lives in the topbar.

TOPBAR (44px, --bg, bottom hairline --border-subtle)
- Left: breadcrumb "Workspace / Intent Hub" — 13px, the leading crumb in --text-quaternary, the
  current page in --text-primary. Sidebar collapse toggle sits to its left at 28x28px.
- Center-left: band pill cluster — three chips, each a colored dot + 11px uppercase mono label +
  mono count ("HOT 12 · WARM 34 · COLD 88"). Chips are filterable and show a lime underline when
  active. Hide on pages where band filtering is meaningless.
- Right: a 28px icon button group (notifications with a lime dot when unread, theme toggle) then
  the page-specific primary CTA — usually "Score account" (lime, 28px tall, --r-md, 13px, black
  text). Per-page CTA overrides: Lists → "New list", Bulk → "Upload CSV", Watchlist → "Add account".

COMMAND PALETTE (⌘K)
- Centered modal, 640px wide, 18vh from top, --surface, --r-xl, the system float shadow, with a
  rgba(8,9,10,0.6) backdrop at 4px blur.
- Search input 52px, 15px, no border, 16px leading icon, placeholder "Search accounts, lists,
  people, or run a command…".
- Results grouped with 10px uppercase mono headers: Accounts · Lists · People · Commands ·
  Navigation. Rows 36px: 14px icon, 13px label, mono domain in --text-tertiary on the right, band
  dot where relevant. Selected row = rgba(255,255,255,0.06) + lime left bar.
- Footer rail 32px: ↑↓ navigate · ↵ open · ⌘K close, all in 10px mono --text-quaternary.
- Empty state: "No results for 'xyz'" + a "Score xyz.com — 1 credit" action row. Turn a dead end
  into the primary action.

RESPONSIVE: below 1024px the sidebar becomes an overlay drawer (280px, slides in 200ms, backdrop
fade). Below 768px the topbar keeps only the hamburger, the page title, and the primary CTA icon.

ACCEPTANCE CRITERIA
- The shell is visually silent — nothing in it competes with page content.
- Lime appears in the chrome in at most three places at once: active nav bar, credits fill, primary CTA.
- Full keyboard operability, visible focus rings, and correct aria-current on the active nav item.
```

---

# PROMPT 06 — DASHBOARD HOME

```
SURFACE: /dashboard — the first screen after login, every day.

PRODUCT GOAL: answer "what changed since yesterday, and who do I call today?" in under 5 seconds.
The current version is a generic KPI-card grid — it reports numbers instead of prompting action.
Invert that: lead with the accounts, support with the metrics.

LAYOUT (top to bottom)
1. GREETING ROW (no card): "Good morning, Abdo" at 22px/600 on the left; on the right a 13px
   --text-tertiary line "Last refresh 12 min ago · 1,240 credits left". 24px bottom margin.

2. TODAY'S MOVES — the hero block, and the most important thing on the screen.
   A 3-column grid of at most 3 account cards, each --bg-elevated, 1px --border, --r-lg, 16px
   padding. Card anatomy:
   · Row 1: 24px company avatar (first letter, deterministic tint) + company name 14px/600 +
     band chip (dot + uppercase mono) pushed right.
   · Row 2: the score, 26px mono tabular-nums, with a delta beside it in 12px mono
     ("+14 this week", green up-arrow icon).
   · Row 3: the AI thesis, 13px --text-secondary, clamped to 2 lines.
   · Row 4: signal tag row — short mono codes (FU · HI · NE · TE · WE) as 10px chips, present ones
     at --text-secondary, absent ones at 25% opacity.
   · Row 5: one action, a ghost 32px button — "Draft outreach" or "Open account".
   Above the grid: a 15px/600 "Today's moves" heading + 12px --text-tertiary sub-line explaining
   the selection rule ("Highest intent, freshest signal, not contacted in 14 days").

3. SIGNAL PULSE — a 7-day activity strip, full width, 120px tall. A sparse bar chart of accounts
   scored per day (bars in --border-strong, today's bar in lime), with band composition shown as
   stacked segments in band colors. X labels 10px mono. No axis lines, no gridlines, no legend box
   — label inline instead.

4. KPI STRIP — four values, no cards, separated only by vertical hairlines: Accounts scored ·
   HOT accounts · Avg score · Credits used. Each: 11px uppercase mono label above, 22px mono
   tabular-nums value, and a 12px mono delta vs. last period (green/amber/grey by direction, never
   lime). Keep this BELOW the fold-priority content — metrics are context, not the mission.

5. TWO-COLUMN LOWER SECTION (2fr / 1fr)
   · Left: "Recent activity" — a 10-row list, 36px rows, hairline separated: avatar, company,
     mono score, band dot, relative timestamp right-aligned in mono. Hover reveals a 12px "Open"
     link. Footer link "View all history →" in lime 13px.
   · Right: "Watchlist alerts" — up to 5 rows, each a band-change event ("Ramp moved WARM → HOT",
     with an arrow glyph and the two band dots). Below it, a compact "Quick score" input: 40px
     domain field + lime "Score" button.

EMPTY STATE (new user, zero scores): replace blocks 2–5 entirely with a single centered 420px
column — 32px lime-tinted square with an icon, 18px/600 "Score your first account", 13px
--text-secondary explaining what happens, a 44px domain input, and the primary CTA. Include one
line of reassurance: "Takes about 20 seconds. Costs 1 credit."

LOADING STATE: skeleton blocks at rgba(255,255,255,0.04) with a 1.4s shimmer, matched exactly to
the final layout dimensions so nothing shifts on load.

ACCEPTANCE CRITERIA
- The first thing the eye lands on is a company name, not a number.
- Every card offers exactly one action.
- No KPI tile has a colored background; bands appear only as dots and chips.
```

---

# PROMPT 07 — INTENT HUB (/pipeline) — the flagship screen

```
SURFACE: /pipeline — the board where a rep works their whole book, ranked by buying intent instead
of last touch. This is the screen that goes in the pitch deck. It must be the best-designed thing
in the product.

PRODUCT GOAL: make prioritization obvious at a glance and make working an account a two-click job.

LAYOUT: full-height, flush page (no page padding), 3 stacked zones.

ZONE 1 — TOOLBAR (44px, bottom hairline)
- Left: view tabs — Board · Table · Timeline. Active tab = --text-primary + a 2px lime underline
  flush to the toolbar's bottom hairline. Inactive = --text-tertiary. 13px, 14px leading icons.
- Center: "Group by" segmented control (Band · Owner · Industry · List) — --surface track, --r-md,
  active segment --bg-elevated with a hairline, 12px labels.
- Right: search field (28px, 200px, --bg-elevated, --r-md), a "Filter" ghost button with a count
  badge, a sort control, and a 28px overflow menu.

ZONE 2 — FILTER BAR (32px, only rendered when filters are active)
Active filters as chips: 11px, --surface, --r-sm, with the key in mono --text-tertiary and the
value in --text-primary ("band: HOT"), each with a 10px × dismiss. A "Clear all" 12px lime text
link at the right end. Do not render an empty bar — collapse the row entirely.

ZONE 3 — THE BOARD (horizontally scrollable, columns 320px wide, 12px gap, full remaining height)
Column header (44px, sticky):
  · A 6px band dot + uppercase mono band name + count in mono --text-tertiary.
  · A second line at 10px mono: "avg 81 · 3 new today".
  · A right-aligned 20px "+" add button that appears on column hover.
  · The column body has a 2px top rule in the band color at 30% opacity — this is the ONLY place a
    band color appears as a line, and it is what makes the board instantly readable.
Account card (--bg-elevated, 1px --border, --r-lg, 12px padding, 8px gap between cards):
  · Top row: the score in 20px mono tabular-nums (left) and a 10px mono "IQ-4F2A" id (right,
    --text-quaternary).
  · Name row: 20px avatar + company name 13px/600 + domain 11px mono --text-tertiary.
  · Thesis: 12px --text-secondary, clamped to 2 lines.
  · Signal chips: 10px mono codes, only the signals that actually fired.
  · Footer: relative timestamp in 10px mono on the left; a stacked owner-avatar cluster (16px,
    -6px overlap) on the right.
  · Hover: background steps to rgba(255,255,255,0.03) and a hidden 3-icon action rail fades in at
    the top-right (open · watch · add to list), 24px targets.
  · Drag: card lifts to the system float shadow and rotates 1.5deg; the target column's top rule
    brightens to 60% opacity. Drop = 160ms settle.
Column empty state: a dashed --border-subtle 1px outline at --r-lg, 96px tall, centered 12px
--text-quaternary text ("No cold accounts — nice").

DETAIL DRAWER (opens on card click): 480px, right-anchored, --bg-elevated, 1px left --border, the
system float shadow, slides in 200ms ease-out. Content: header (avatar, name, domain, band chip,
score) → tab row (Triggers · Activity · People · Notes) → trigger list with source and date per
row → the AI thesis block → "Recommended next action" with two buttons (lime primary "Draft
outreach", ghost "Save play"). Esc and a 28px × close both dismiss it; focus is trapped while open.

TABLE VIEW: same data at 32px rows — checkbox, company, domain (mono), score (mono, right-aligned),
band chip, signal codes, owner, last scored (mono), and a row-hover action rail. Sortable headers
in 11px uppercase mono with a lime sort caret. Column widths resizable. Selecting rows raises a
floating bulk-action bar at the bottom center (the system float shadow) with the selection count in
mono and 3 actions.

ACCEPTANCE CRITERIA
- A rep can identify their top 3 accounts within 3 seconds of the board painting.
- Band color appears only as: the column top rule, the dot in chips, and nothing else.
- The board scrolls horizontally without the page scrolling vertically.
- Full keyboard support: arrows move between cards, Enter opens the drawer, Esc closes it.
```

---

# PROMPT 08 — SCORE (/score) — the magic moment

```
SURFACE: /score — where a user types a domain and watches an account get scored. This is the
product's core loop and its most emotionally important screen. It costs a credit, so it must feel
worth it.

THREE DISTINCT PHASES — design all three as one continuous surface, not three pages.

PHASE 1 — INPUT (calm, focused, centered)
- A single command-line-styled input, 640px wide, 56px tall, --bg-elevated, 1px --border, --r-xl.
  A mono lime prefix chip ("score →") on the left, then a 15px mono domain input, then a 40px lime
  circular go-button on the right with an arrow icon.
- Focus: 2px lime ring, border transparent, and a subtle 1px lime inner line on the prefix.
- Below at 12px --text-quaternary: "1 credit · results cached 24h". To the right, a small "Recent"
  row of the last 5 scored domains as 11px mono chips that refill the input on click.
- Above the input: 22px/600 "Score an account" and a 13px --text-tertiary sub-line.
- Nothing else on the screen. The whole page is this input.

PHASE 2 — LIVE PROGRESS (the 8–20 seconds that sell the product)
Do NOT show a generic spinner. Show the work happening:
- The input collapses upward into a 44px header row showing the domain in mono with a lime pulse dot.
- Below it, a vertical step list — one row per signal source: Funding · Hiring · News · Technology ·
  Web activity · GitHub · AI reasoning. Each row 32px: a 16px status glyph (pending = dim --border
  ring; active = lime 1.5px ring with a 1.2s rotation; done = lime check; empty = --text-quaternary
  dash), the source name at 13px, and a right-aligned mono result once complete ("3 signals · 18/25").
- Rows resolve in real order as data returns, each with a 160ms fade + 4px rise. The perceived
  latency drops dramatically because the user watches progress instead of waiting.
- A footer line in 11px mono: elapsed seconds + "1 credit will be charged on completion".
- Cached-result variant: skip the theatre entirely, show a 32px "Cached from 4h ago — no credit
  charged" strip with a "Re-score" ghost button. Honesty about not charging is a trust moment.

PHASE 3 — RESULT (the artifact)
1. RESULT HEADER: 32px avatar + company name 22px/600 + domain in 13px mono + a mono "IQ-4F2A" id
   chip. Meta row beneath at 12px: industry · employees · location · last scored — dot-separated in
   --text-tertiary. Right side: "Re-score" ghost + "Add to watchlist" ghost + a lime primary
   "Draft outreach".
2. THE SCORE OBJECT: a 180px circular ring on the left. Track = --border at 6px; fill = the band
   color at 6px with a round linecap, animating from 0 to value over 900ms cubic-bezier(.2,.8,.2,1).
   Center: band chip on top (dot + uppercase mono 11px), the score in 56px mono tabular-nums
   -0.03em, and "/ 100" in 13px --text-quaternary. NO glow, NO pulse animation — the number is
   already the loudest thing on the screen.
3. THE THESIS: beside the ring, a --bg-elevated, --r-lg, 20px-padded block. A 14px lime sparkle
   icon + "AI thesis" at 11px uppercase mono, then the summary at 15px/1.6 --text-primary (this is
   the one place the app uses 15px body — it is meant to be read, not scanned). Footer meta at
   11px mono: "Generated just now · Claude · 4 sources".
4. SIGNAL AXES: an 11px uppercase mono section label with a trailing hairline rule. Then a 3-column
   grid of signal cards (--bg-elevated, 1px --border, --r-lg, 16px). Each: icon + name at 13px/600,
   the contribution in 18px mono ("18 / 25"), a 3px horizontal fill rail showing raw vs decayed
   (decayed portion in the band color, decay loss in --border-subtle), a 12px --text-secondary
   one-line detail, and an 11px mono freshness line ("observed 9 days ago · 0.82 fresh"). Signals
   with no data render at 50% opacity with a "no signal" label — never hidden, because absence is
   information.
5. EVIDENCE: an expandable list under each signal — 12px rows with the evidence label, the source
   name as a lime external link, and the observed date in mono. Collapsed by default, with a
   "3 sources" 11px mono toggle.
6. RECOMMENDED ACTION: a full-width block with a 1px lime left border and a rgba(223,255,0,0.04)
   wash. 11px uppercase mono "Recommended next action", the action at 15px, then two buttons.
   This is the payoff — give it real estate.

ERROR / EDGE STATES (design each explicitly)
- Invalid domain: inline under the input, no page change.
- Insufficient credits: replace the go-button with a lime "Top up" button and show a 13px line
  explaining the balance. Never let the user spend a click to discover they can't proceed.
- Unscorable (no signals found anywhere): a real result page with score suppressed, an honest
  "Not enough signal to score this account" headline, the sources checked listed as evidence of
  work done, and a "we didn't charge you" line.
- Partial (some sources down): score shown with a 32px --warm strip naming which sources were
  unavailable and how confidence is affected.

ACCEPTANCE CRITERIA
- Phase 2 makes 15 seconds feel short.
- The band color appears only in the ring fill, the band chip dot, and the signal decay rails.
- The result is screenshot-worthy: a rep should want to paste it into Slack.
```

---

# PROMPT 09 — PEOPLE (/people, Beta)

```
SURFACE: /people — scores individual decision-makers at tracked accounts on ICP fit, and drafts the
approach angle. Currently in beta.

PRODUCT GOAL: turn "which company" into "which human, and what do I open with?"

LAYOUT: two-pane, 420px list + flexible detail, full height.

LEFT PANE — PERSON LIST
- Header (44px): "People" 15px/600, a "Beta" chip, and a count in mono. Below it a 32px search
  field and a filter row of chips (HOT contacts · Champions · Decision-makers · Recently scored).
- Rows (56px, hairline separated): 32px avatar, name 13px/600, title + company at 11px
  --text-tertiary on the second line, and on the right an ICP-fit score in 15px mono tabular-nums
  with a band dot beneath it. Selected row = rgba(255,255,255,0.06) + 2px lime left bar.
- A "Score a person" affordance pinned at the bottom of the pane: 40px input row + lime button,
  with the credit cost stated at 11px.

RIGHT PANE — PERSON DETAIL
1. Header: 48px avatar, name 22px/600, title 13px --text-secondary, company row with its avatar
   and band chip (the person's context is their account), and a LinkedIn external-link icon button.
2. Fit block: ICP fit as a 15px label + 34px mono score + a horizontal 4px rail. Beside it, three
   mono sub-scores (Seniority · Function · Account fit) at 11px labels + 16px mono values.
3. "Person context": a --bg-elevated block, 13px/1.6, describing who they are and why they matter,
   with an "AI thesis · Claude" 11px mono attribution footer.
4. "Approach angle": the highest-value block. 1px lime left border, rgba(223,255,0,0.04) wash, an
   11px uppercase mono label, the angle at 15px, and a quotable opening line rendered in a
   --surface block at 13px with a copy-to-clipboard icon button. Copy is the action here.
5. Action row: "Re-score" ghost · "Save to list" ghost · "Draft outreach" lime primary.
6. Meta footer: 11px mono — scored date, cache expiry, source count.

EMPTY STATES
- No people yet: centered column inside the right pane — icon square, "Find the decision-maker",
  a 13px explainer, and a domain input that finds people at a tracked account.
- Nothing selected: a calm centered 13px --text-quaternary line, not a blank void.

ACCEPTANCE CRITERIA
- The list is scannable at 56px rows without feeling like a spreadsheet.
- The "Beta" chip is present but muted — visible honesty, not an apology.
- The opening line is one click from the clipboard.
```

---

# PROMPT 10 — WATCHLIST (/watchlist)

```
SURFACE: /watchlist — accounts the user has asked to be re-scored automatically, with alerts on
band changes. This is the product's retention mechanic: it creates a reason to come back daily.

PRODUCT GOAL: make band CHANGES the hero, not the static list.

LAYOUT
1. PAGE HEAD: "Watchlist" 22px/600 + a mono count and a plan-limit line ("24 of 100 tracked" —
   with the number turning --warm above 85%). Right: refresh-cadence selector (Daily · Weekly) and
   a lime "Add account" primary.
2. ALERT STRIP — the top block, and the point of the page. A horizontally scrolling row of change
   cards (280px, --bg-elevated, --r-lg, 12px padding): company avatar + name, then the transition
   rendered as [old band dot + label] → arrow → [new band dot + label] with the new band emphasized,
   the score delta in 16px mono ("+22"), the trigger reason at 12px --text-secondary, and a
   timestamp in 10px mono. Upgrades (COLD→WARM→HOT) get a subtle 1px border in the new band color;
   downgrades stay neutral — celebrate opportunity, don't punish.
   If there are no changes: a single 48px row at 13px --text-tertiary, "No band changes in the last
   7 days. 24 accounts monitored." Calm, not empty.
3. LIST TABS: All · HOT · Changed · Stale — 13px with a lime underline on active and mono counts.
4. TABLE (32px rows): checkbox · company (avatar + name + mono domain) · current score (mono) ·
   band chip · 7-day sparkline (24px tall, 60px wide, 1px stroke in the band color, no axes) ·
   next refresh (mono relative) · owner · row actions on hover (re-score now, mute alerts, remove).
   Header row 11px uppercase mono, sticky.
5. BULK BAR: when rows are selected, a floating bar at the bottom center with the count in mono and
   three actions (Re-score selected · Add to list · Remove). Uses the system float shadow.
6. QUICK ADD: a persistent 40px row above the table — domain input + "Track" button, so adding is
   never more than one interaction away.

STATES: empty (never tracked anything), at plan limit (the "Add" button disables with a 12px
"Upgrade to track more" lime link beside it — never a modal), stale (accounts whose refresh failed
get a 12px --warm "refresh failed" chip and a retry link).

ACCEPTANCE CRITERIA
- Changes are visible before the list is.
- Sparklines use band color only, at 1px, with no fill.
- The plan limit is communicated before the user hits it, not after.
```

---

# PROMPT 11 — LISTS (/lists and /lists/[id])

```
SURFACES: /lists (overview) and /lists/[id] (detail). Lists are how users segment their book —
by campaign, territory, ICP experiment, or quarter.

/LISTS — OVERVIEW
- Page head: "Lists" 22px/600 + mono count. Right: lime "New list" primary.
- A 3-column card grid (--bg-elevated, 1px --border, --r-lg, 20px padding, 16px gap):
  · Title 15px/600 + a 12px --text-tertiary description clamped to one line.
  · Band composition bar: a single 6px full-width rail split into HOT/WARM/COLD proportions in band
    colors, --r-sm. Below it, three 11px mono counts with dots. This makes list health readable in
    one glance and is the card's whole reason to exist.
  · Stats row: accounts (mono) · avg score (mono) · last updated (mono relative).
  · Footer: stacked member avatars on the left, an overflow menu on the right.
  · Hover: background steps up 2%, and the title goes --text-primary.
- Empty state: centered column with an icon square, "Group accounts into lists", a 13px explainer
  of two real use cases, and the primary CTA.
- Create-list modal: --surface, --r-xl, system float shadow, 480px. Fields: name, description,
  color-free (lists do NOT get their own colors — band colors are the only color language), and an
  optional "start from" selector (Empty · Current filter · CSV upload). Primary lime "Create".

/LISTS/[ID] — DETAIL
- Head: back chevron + list name (inline-editable on click, showing a 1px lime underline while
  editing), description below at 13px, and a mono meta line. Right: "Add accounts" lime primary +
  overflow (rename, duplicate, export CSV, delete).
- A 4-value KPI strip: accounts · HOT · avg score · scored this week. Hairline-separated, no cards.
- Table identical to the Intent Hub table view for consistency — 32px rows, mono numerics, sortable
  headers, hover action rail, bulk selection bar.
- A right-side "List insight" panel (320px, collapsible): the AI-generated read on the list ("8 of
  24 accounts show hiring signal in the last 30 days"), rendered as 13px/1.6 with a mono attribution
  footer.
- Delete confirmation: a modal that states exactly what will be removed and what won't ("The 24
  accounts stay in your workspace — only the list is deleted"). Destructive action is a #f87171
  text button, not a red filled button.

ACCEPTANCE CRITERIA
- The composition bar makes a list's health legible without reading a number.
- Lists never introduce their own accent colors.
- Rename works inline; nothing about lists requires a modal except create and delete.
```

---

# PROMPT 12 — BULK SCORE (/bulk)

```
SURFACE: /bulk — upload a CSV of up to 1,000 domains and score them as a job. Credits are deducted
upfront, so the pre-flight moment carries real financial weight and must be unambiguous.

PRODUCT GOAL: make a 1,000-credit commitment feel controlled and reversible-until-confirmed.

FOUR-STATE FLOW on one page:

STATE 1 — UPLOAD
A large dropzone: 240px tall, 1px dashed --border, --r-xl, --bg-elevated. Centered: 32px upload
icon in a lime-tinted rounded square, "Drop a CSV or click to browse" at 15px, and a 12px
--text-tertiary line naming the requirements (one column of domains, max 1,000 rows). Drag-over
state: border goes solid lime, background gets a rgba(223,255,0,0.04) wash — 120ms transition.
Beside it, a "Download template" 13px lime link and a "Paste domains instead" toggle that swaps the
dropzone for a mono textarea.

STATE 2 — PRE-FLIGHT (the most important state)
A parsed-preview table (32px rows, first 10 rows + "…and 214 more" in mono) with a per-row validity
glyph: valid = lime check, duplicate = --text-quaternary dash with a "duplicate" chip, invalid =
#f87171 alert with the reason, already-cached = a --text-secondary clock with "cached · free".
Above it a summary bar: "228 valid · 12 duplicates · 4 invalid · 31 cached".
Then the COST BLOCK — --bg-elevated, 1px --border, --r-lg, 20px padding:
  · "Credits required" 11px uppercase mono, value 26px mono tabular-nums.
  · A second line: "Your balance after this job: 1,012" in 13px mono.
  · If insufficient: the number turns --warm, and a "Top up" lime button replaces the run button.
  · Primary: "Score 228 accounts — 228 credits" (lime, 44px). The cost is IN the button label.
  · Ghost "Cancel" beside it.

STATE 3 — RUNNING
A job header: job id in mono, status chip ("Processing"), started-at, and an ETA. A full-width 4px
progress rail with a lime fill and a mono "142 / 228" counter above it. Below, a live-updating
results table that fills in as rows complete — completed rows show score and band, pending rows
show a dim --border-subtle placeholder bar. A "Run in background" ghost button that makes it clear
the user can leave; a persistent progress chip then lives in the topbar.

STATE 4 — COMPLETE
A summary strip: total scored, band distribution as a 6px composition rail with mono counts, avg
score, credits spent, duration. Then the full results table with sorting and a filter row. Actions:
"Export CSV" ghost · "Save all to a list" ghost · "Open in Intent Hub" lime primary.
Failures get their own collapsed section: "4 accounts could not be scored" with per-row reasons and
an explicit "these were not charged" line.

JOB HISTORY: below everything, a compact table of past jobs (32px rows) — job id in mono, date,
count, credits, status chip, and a link to results.

ACCEPTANCE CRITERIA
- The user cannot spend credits without seeing the exact number in the button they press.
- Cached rows are visibly free before the run, not discovered after.
- The running state is safe to navigate away from.
```

---

# PROMPT 13 — HISTORY (/history)

```
SURFACE: /history — every score the workspace has ever run. It is a record, an audit trail, and a
way to spot trends.

LAYOUT
1. HEAD: "History" 22px/600 + a mono total. Right: a date-range selector (7d · 30d · 90d · All as a
   segmented control), an export button, and a search field.
2. ACTIVITY CHART — full width, 160px. Bars = scores per day, stacked by band in band colors,
   1px gaps, --r-sm tops. No gridlines; instead a single dashed --border-subtle line at the period
   average with an 11px mono label on the right. Hover shows a floating tooltip (system float
   shadow, --surface, --r-md, 11px mono) with the date and band breakdown. Brushing a range filters
   the list below — the chart is a control, not decoration.
3. DATE-GROUPED LIST. Sticky group headers (32px): "Today" / "Yesterday" / "Thu, 12 Feb" at 12px/600
   with a mono count on the right, --bg background so rows scroll under them cleanly.
   Rows (36px): time in mono --text-quaternary · avatar + company · mono domain · score in mono ·
   band chip · a signal-code strip · "cached" chip where applicable · a right-aligned overflow.
   Hover: 2% wash + a "Re-score" ghost action appears.
4. DETAIL DRAWER on row click — the same 480px drawer pattern as Intent Hub, showing that score's
   full result as it was at the time, plus a "compare to current" toggle that renders deltas per
   signal in mono with directional arrows. Score history is only valuable if you can see the change.
5. FILTER RAIL (collapsible, 240px, right): band checkboxes with counts, score-range dual slider
   (lime track), signal-present toggles, source (manual / bulk / watchlist refresh), and owner.

EMPTY / EDGE STATES: no history yet (centered CTA to score the first account); filtered to nothing
("No scores match these filters" + a "Clear filters" lime link); loading (skeleton rows matching the
36px rhythm exactly).

ACCEPTANCE CRITERIA
- The chart is interactive and filters the list.
- Group headers stick correctly and never overlap row content.
- 500 rows scroll at 60fps — virtualize and keep row DOM minimal.
```

---

# PROMPT 14 — INBOX (/inbox)

```
SURFACE: /inbox — alerts and notifications: band changes, watchlist triggers, bulk-job completions,
credit warnings, and list activity.

PRINCIPLE: an inbox that generates anxiety gets muted and then abandoned. Design for calm triage —
signal density low, action clarity high.

LAYOUT: three panes — 200px filter sidebar · 380px list · flexible detail.

PANE 1 — FILTERS (--sidebar background)
Sections with 10px uppercase mono headers: "Views" (All · Unread · Mentions · Archived) and
"By type" (Band change · New signal · Bulk complete · Credit alert · List activity) and "Lists"
(per-list subscriptions). Each row 28px, 13px, with a mono count on the right. Active = lime left
bar + --text-primary.

PANE 2 — LIST
- Header (36px): the current view name at 13px/600, a mono count, and "Mark all read" as a 12px
  ghost link.
- Rows (64px, hairline separated, 12px padding): a 6px lime unread dot in the left gutter (absent
  when read), a 24px type icon in a --surface rounded square, the title at 13px/600 (company name
  leading), a 12px --text-secondary preview clamped to one line, and a right-aligned relative
  timestamp in 11px mono. Read rows drop the dot and step the title to --text-secondary — never
  grey out the whole row.
- Selected: rgba(255,255,255,0.06) + 2px lime left bar.
- Hover reveals three 24px actions on the right: archive, mute source, open account.

PANE 3 — DETAIL
Header: the event title at 18px/600, the company row with avatar and band chip, and the timestamp
in mono. Then the event body — for a band change, render the transition graphic (old band → new
band with the score delta in 20px mono) plus the triggering signal with its source link and date.
Then a "Why you got this" 11px uppercase mono block naming the subscription ("Subscribed via list:
Q1 Enterprise") with an inline "Unsubscribe" 12px lime link — always let people leave.
Footer actions: lime "Open account" primary + ghost "Draft outreach" + ghost "Archive".
Nothing-selected state: a centered 13px --text-quaternary line and a small icon, never a void.

ACCEPTANCE CRITERIA
- Unread is communicated by one 6px dot and one weight step. Nothing else.
- Every notification states why it was sent and offers a one-click way to stop it.
- The list is keyboard navigable (j/k or arrows, e to archive, Enter to open).
```

---

# PROMPT 15 — MEMORY (/memory) — the ICP profile

```
SURFACE: /memory — where the user's Ideal Customer Profile lives. It's captured in onboarding and
used to compute ICP fit across scoring. Today it's a bare form; it should feel like the product's
brain.

PRODUCT GOAL: make the user feel the product knows them, and make correcting it trivial.

LAYOUT: single 800px centered column.

1. HEAD: "Memory" 22px/600 + a 13px --text-tertiary sub-line: "What VesperWise knows about who you
   sell to. This shapes every score."

2. "YOUR ICP IN PLAIN ENGLISH" — the hero block. --bg-elevated, 1px --border, --r-xl, 24px padding.
   A generated paragraph at 15px/1.7 --text-primary that reads like a human wrote it: "You sell
   developer-tooling to Series A–C SaaS companies in North America, 50–500 employees. You care most
   about hiring and technology signals." A "Regenerate" 12px ghost and an 11px mono "Last updated"
   footer. Seeing the profile in prose is what makes it feel intelligent.

3. STRUCTURED FIELDS — a definition-list layout, not a form. Each row: a 12px --text-tertiary label
   on the left (160px), the value on the right as chips or text at 13px, and an "Edit" ghost that
   appears on row hover. Rows: What you sell · Company size · Industries · Geography · Signal
   priorities · Exclusions. Editing happens inline — the row expands to reveal the control and two
   buttons (Save lime, Cancel ghost). No modals.

4. ICP FIT SCORING — an explainer block showing how the profile converts to a fit percentage.
   A horizontal weight bar per dimension (Industry 30% · Size 25% · Geography 20% · Signal match
   25%) with 3px rails and mono percentages. Below it, a live example: pick a recent account and
   show its fit breakdown per dimension. Explaining the mechanism is what earns trust in the number.

5. SIGNAL WEIGHT TUNING (if the plan allows it): six sliders, one per signal, lime track and a 14px
   handle, with mono percentage values that always sum to 100 (adjusting one rebalances the rest).
   A "Reset to default" 12px ghost. Show the effect immediately: "This would move 3 accounts from
   WARM to HOT" in 12px --text-secondary — the feedback is the feature.

6. EMPTY STATE (profile never completed): a centered block with a 13px explainer of what improves
   when the profile exists, and a lime "Set up your profile" CTA that opens the onboarding steps
   inline rather than routing away.

ACCEPTANCE CRITERIA
- The plain-English paragraph is the first thing read.
- Every field is editable in place in under 3 interactions.
- The page explains how the ICP affects scoring, with a concrete example.
```

---

# PROMPT 16 — AUTOPILOT (/autopilot) — gated, plus the full builder

```
SURFACE: /autopilot — workflows that fire when intent crosses a threshold. Currently gated behind a
"Coming soon" state. Design BOTH: the gate the user sees now, and the full builder behind it (which
is what appears in the pitch deck).

PART A — THE COMING-SOON GATE
Centered 440px column, vertically centered in the page. A 48px lime-tinted rounded square with a
Zap icon at 20px. "Autopilot" at 22px/600 with a muted "Soon" chip beside it. A 13px/1.6
--text-secondary paragraph describing exactly what it will do, in specifics not marketing
("When an account crosses into HOT, route it to the owner, draft the outreach, and post to Slack").
Then a 3-row preview of the trigger → condition → action chain as static, dimmed nodes at 60%
opacity. A lime "Notify me when it ships" ghost button. Never a broken half-feature — a confident
placeholder outranks a partial build.

PART B — THE BUILDER (design it fully; ship it later)
Two-pane, full-height, flush page.
- LEFT PANE (320px): workflow list. Header with a lime "New workflow" button. Cards (12px padding,
  --bg-elevated, --r-lg): name at 13px/600, a status chip (Active with a lime dot / Paused /
  Draft), a 12px --text-tertiary trigger summary, and a footer with fires-this-week in mono and a
  7-day sparkline. Selected = 2px lime left bar.
- RIGHT PANE: the flow canvas on a dot-grid background (rgba(255,255,255,0.03), 24px pitch).
  Nodes are 260px, --bg-elevated, 1px --border, --r-lg:
  · Trigger node — 1px lime top border, 11px uppercase mono "WHEN", the condition at 14px/600
    ("Score crosses 75"), and a 12px --text-tertiary detail line.
  · Condition node — 11px uppercase mono "IF", with conditions as mono chips joined by " · "
    separators (never the words AND/OR — use the separator grammar from the reference).
  · Action nodes — 11px uppercase mono "THEN", with an integration icon, the action at 14px/600,
    and a config summary. Multiple actions stack vertically with a shared connector.
  · Connectors: 1.5px lime lines with a small arrowhead, orthogonal routing with 8px corner radii.
  · Node hover reveals a 24px edit and delete rail; a "+" appears on each connector to insert a step.
- CONFIG DRAWER: clicking a node opens a 400px right drawer with that node's settings — no modals,
  no separate pages.
- TOOLBAR above the canvas: workflow name (inline editable), an Active/Paused toggle switch (lime
  when on), "Test run" ghost, "History" ghost, and a Save primary.
- RUN HISTORY view: a table of fires (32px rows) — timestamp in mono, the account, the outcome chip
  (Fired / Skipped / Failed), and the reason at 12px. Plus a 120px bar chart of fires over time.

ACCEPTANCE CRITERIA
- The gate feels intentional, not unfinished.
- The canvas reads left-to-right with no legend required.
- The builder is fully designed even though it ships later — investors will ask.
```

---

# PROMPT 17 — BILLING (/billing)

```
SURFACE: /billing — plan, credits, usage, top-ups, invoices, payment method. Powered by Polar.

PRINCIPLE: billing is where trust is won or lost. Radical clarity, zero dark patterns, and the
downgrade path as visible as the upgrade path.

LAYOUT: single 960px column, sectioned with 40px gaps and no card-in-card nesting.

1. BILLING HERO — the current state at a glance. --bg-elevated, 1px --border, --r-xl, 24px padding,
   two columns:
   · Left: plan name at 22px/600 with a lime plan chip, price at 13px mono ("$99 / month"), and the
     renewal date at 12px --text-tertiary. Below: "Change plan" ghost + "Cancel" as a 12px
     --text-quaternary text link (present, findable, not hidden).
   · Right: credits — 34px mono tabular-nums remaining over the cap, a 4px progress rail (lime;
     --warm below 15%), a reset date at 12px, and a lime "Top up" button.

2. USAGE CHART — 180px, credits consumed per day over the billing period. Bars in --border-strong
   with today in lime. A dashed --border-subtle line at the daily burn rate needed to stay within
   plan, labelled in 11px mono. Add a projection line to period end and a plain-language line:
   "At this pace you'll use 1,840 of 2,000 credits." Predictive, not just historical.

3. COST BREAKDOWN — a 3-row table: subscription, top-ups, total this period. 13px labels, mono
   right-aligned amounts, a hairline above the total row, and the total in 15px/600 mono.

4. PLANS GRID — four columns. The current plan is marked with a 1px lime border and a "Current"
   chip; the recommended upgrade gets a muted "Recommended" chip only if usage actually justifies
   it. Each column: name, price in 26px mono, a 12px credits line, a feature list at 13px with 14px
   lime checks, and a CTA (lime primary for upgrades, ghost for downgrades). A monthly/annual toggle
   with the annual discount stated as an exact number, not a vague "save more".

5. TOP-UPS PANEL — three cards (100 / 500 / 1,000 credits) with the price in 20px mono and a
   per-credit unit price in 11px mono beneath so the volume discount is verifiable. Purchase opens
   Polar checkout; design the pending and success return states.

6. LEDGER — a transaction table (32px rows): date (mono), description, type chip (Subscription ·
   Top-up · Usage · Refund), amount (mono, right-aligned, negatives in --text-secondary not red),
   and a running balance in mono. Filterable by type.

7. INVOICES — rows with invoice number (mono), date, amount (mono), a status chip (Paid lime-dot /
   Open / Failed), and a download icon button.

8. PAYMENT DETAILS — card brand icon, •••• last-4 in mono, expiry, and an "Update" ghost that opens
   the Polar portal.

9. DANGER ZONE — the last block. 1px #f87171 border at 30% opacity, --r-lg. "Cancel subscription"
   and "Delete workspace" as text buttons in #f87171 (never filled red). Each requires a
   confirmation that states exactly what is lost and when access actually ends.

STATES: failed payment (a persistent --warm strip at the top of the page with an "Update payment
method" action — not a blocking modal), plan change pending, credits exhausted (an inline block
explaining what still works and what doesn't).

ACCEPTANCE CRITERIA
- The user can find how to cancel in under 10 seconds.
- Every price and credit figure is mono tabular-nums.
- No urgency theatre, no fake scarcity, no pre-checked upsells.
```

---

# PROMPT 18 — API KEYS (/api-keys) + Settings (/settings)

```
SURFACE A: /api-keys — currently gated "Soon". Design the gate AND the full surface.

GATE: same pattern as Autopilot — centered column, tinted icon square, "API Keys" + "Soon" chip, a
13px description of what the API does, a dimmed preview of a key row, and a "Request early access"
ghost.

FULL SURFACE:
1. Head: "API Keys" 22px/600 + a 13px --text-tertiary line with a lime "Read the docs →" link.
2. Rate-limit strip: plan RPM in mono, current usage as a 3px rail, and a 12px line.
3. Key table (44px rows): name, the masked key in mono ("vw_live_••••••••3f2a") with a copy icon,
   created date (mono), last used (mono relative), scopes as 10px mono chips, and a revoke action
   in #f87171 text.
4. Create-key flow: a modal (--surface, --r-xl, float shadow) with a name field and scope
   checkboxes. On success the modal REPLACES its content with the full key in a mono --bg block, a
   large copy button, and an unmissable 13px --warm line: "This is the only time you'll see this
   key." Downloading or copying is the only way out.
5. Revoke: a confirmation naming the key and stating that requests using it fail immediately.
6. Empty state: an icon square, "No keys yet", a 13px line, and a lime "Create key" CTA plus a
   3-line curl example so the user sees the payoff before committing.

SURFACE B: /settings — a two-column layout, 200px section nav + content.
Sections: Profile (name, email, avatar) · Workspace (name, timezone, default refresh cadence) ·
Notifications (a matrix of event types × channels — email / in-app — as 20px switches, lime when
on) · Appearance (Dark / Light / System as three preview tiles, each a miniature of the actual UI,
selected = 1px lime border) · Team (member rows with role selectors and an invite flow) ·
Danger zone.
Every setting saves inline on change with a 12px "Saved" confirmation that fades after 2s — no
global Save button, no modals, no toast spam.

ACCEPTANCE CRITERIA
- A secret is shown exactly once and the UI says so unmissably.
- Settings never require a save button.
- The theme picker previews the real UI, not color swatches.
```

---

# PROMPT 19 — LIGHT MODE

```
TASK: define the light theme as a genuine first-class variant of the system in PROMPT 00 — not an
inversion filter and not a diluted afterthought.

MAPPING RULES
- Canvas #ffffff · elevated #fafafa · surface #f4f5f6 · sidebar #f8f9fa.
- Ink: primary #08090a · secondary #40464f · tertiary #6b7280 · quaternary rgba(8,9,10,0.45).
- Hairlines: rgba(0,0,0,0.08) / 0.13 / 0.04 — same alphas, black instead of white.
- Hover wash becomes rgba(0,0,0,0.03). Selected wash becomes rgba(223,255,0,0.10).

THE ACCENT PROBLEM — solve this explicitly. #dfff00 on white is nearly invisible and fails
contrast. In light mode:
- Keep #dfff00 as a FILL for primary buttons (with #08090a text, which passes comfortably) — this
  preserves brand recognition.
- For accent TEXT, links, and thin indicators, use a darkened brand variant --accent-ink #6b7d00
  (an olive step of the same hue) which passes 4.5:1 on white. Never render #dfff00 as text on a
  light surface.
- Focus rings in light mode use --accent-ink at 2px so they remain visible.

BANDS in light mode: HOT #16a34a · WARM #b45309 · COLD #6b7280 — same semantics, contrast-corrected.
Band dots stay dots; band chips get a 8%-tint background in light mode only, because a bare dot on
white reads weaker than on black.

SHADOW: light mode gets one shadow too — 0 12px 32px rgba(8,9,10,0.12), 0 0 0 1px rgba(0,0,0,0.06)
— on the same float-only elements.

DELIVERABLE: a side-by-side of Intent Hub, Score result, and the sidebar in both themes, plus the
complete light-mode token block ready to paste into :root. Verify every text/background pair at
4.5:1 (3:1 for text ≥ 18px) and list any pair that fails with its fix.
```

---

# PROMPT 20 — CROSS-CUTTING SYSTEM (states · motion · a11y · responsive · charts)

```
TASK: design the system-level pieces that appear on every screen. These are what separate a polished
product from a collection of screens — and they are usually the missing 20% that costs a demo.

1. EMPTY STATES — one template, five instances (dashboard, history, lists, watchlist, inbox).
   Template: 48px icon in a lime-tinted --r-lg square, an 18px/600 headline that names the ACTION
   not the absence ("Score your first account", never "No data"), a 13px/1.6 --text-secondary line
   of two sentences max, one primary CTA, and an optional 12px secondary link. Max width 400px,
   vertically centered in the content area. No illustrations, no mascots.

2. LOADING STATES
   - Skeletons: rgba(255,255,255,0.04) blocks with a 1.4s left-to-right shimmer at 8% opacity,
     matched to final dimensions so zero layout shift occurs. Use for lists, tables, and cards.
   - Inline spinner: a 14px 1.5px lime ring, 800ms rotation. Only inside buttons and small rows.
   - Never a full-page spinner. Never a progress bar that isn't tied to real progress.
   - Optimistic UI: watchlist adds, list adds, and archives apply instantly with a silent rollback
     and a 13px error toast on failure.

3. ERROR STATES — four tiers, each designed:
   - Field error: 12px #f87171 text + 14px icon under the input. Height reserved in advance.
   - Section error: a 44px inline strip inside the section, --r-md, 1px #f87171 at 30%, with a
     retry ghost. The rest of the page keeps working.
   - Page error: centered column, a plain-English explanation, a retry primary, and a support link.
   - Toast: bottom-right, 320px, --surface, --r-lg, the float shadow, a 3px left border in the
     status color, 13px message, an optional action link, auto-dismiss at 5s (errors persist until
     dismissed). Max 3 stacked.

4. MOTION SPEC — one table covering every animation in the product:
   micro (hover, press) 120ms ease-out · component (drawer, modal, dropdown) 200ms
   cubic-bezier(.2,.8,.2,1) · page transitions 180ms fade + 4px rise · the score ring 900ms
   cubic-bezier(.2,.8,.2,1) · skeleton shimmer 1.4s linear infinite. Nothing exceeds 900ms except
   ambient loops. Every transform-based animation is GPU-friendly (transform/opacity only).
   @media (prefers-reduced-motion: reduce) removes all transforms and reduces durations to 0.01ms.

5. ACCESSIBILITY PASS
   - Contrast: every text/background pair at 4.5:1 (3:1 for ≥18px). Audit --text-quaternary
     specifically — it is the likeliest failure — and state the minimum size it may be used at.
   - Never encode meaning in color alone: every band color is accompanied by its uppercase mono
     label. This matters directly — HOT/WARM/COLD as green/amber/grey is a red-green problem.
   - Visible 2px lime focus rings on every interactive element, offset 2px, never removed.
   - Full keyboard paths for: command palette, board navigation, drawer open/close with focus trap
     and restore, table row selection, modal dismissal.
   - Semantic landmarks, aria-current on active nav, aria-live for score completion and toasts,
     44px minimum touch targets on mobile.

6. RESPONSIVE STRATEGY — define per surface at 1440 / 1280 / 1024 / 834 / 640 / 420px:
   - Sidebar → overlay drawer below 1024.
   - Intent Hub board → single column with a band selector above it at 834; cards go full width.
   - All tables → card lists below 834 (each row becomes a stacked card with label:value pairs);
     never horizontally scroll a data table on a phone.
   - Two-pane layouts (People, Inbox, Autopilot) → list-only with a push-navigation detail view.
   - Score result → ring and thesis stack vertically; signal grid goes 3-col → 1-col.
   - Marketing hero type steps 56 → 40 → 34 → 28.

7. DATA VISUALIZATION RULES
   - Chart palette: --text-secondary and --border-strong for neutral series; band colors ONLY when
     the series literally represents bands; lime reserved for "current/today/you".
   - No gridlines. Use one dashed reference line where a benchmark exists.
   - No legend boxes — label series inline at the end of the line or on the bar.
   - All chart numerals are mono tabular-nums.
   - Tooltips use the float shadow, --surface, --r-md, 11px mono.
   - Sparklines: 1px stroke, no fill, no axes, no dots except the terminal value.

DELIVERABLE: one "system reference" page rendering every state, the motion table, the responsive
matrix, and a contrast audit table with pass/fail per pair.
```

---

# PROMPT 21 — INVESTOR-READINESS PASS

```
TASK: act as a design partner at a top-tier fund reviewing VesperWise before a seed/Series A
meeting. You have the full design system and every screen from the previous prompts.

Do three things:

1. AUDIT. Go screen by screen and identify what signals "solo project" rather than "funded
   company." Be specific and unsentimental. Look especially for: inconsistent spacing rhythm,
   more than one accent color leaking in, decorative gradients or glows, empty states that say
   "no data", generic icons, placeholder copy, mismatched border radii, tables that don't align
   numerically, and any screen where the primary action isn't obvious in 3 seconds.

2. RANK. Produce a prioritized list of the 10 highest-leverage fixes — ordered by (perceived
   quality gain) / (implementation cost). For each: the screen, the specific change, the reason it
   moves perception, and a rough effort estimate. The goal is that the first three fixes carry
   most of the gain.

3. PRODUCE THE DEMO PATH. Design the exact 5-screen sequence for a 90-second live demo, and
   specify what must be pixel-perfect on each:
   Landing hero → Score input → Score running → Score result → Intent Hub board.
   For each screen, name the single moment that has to land, the sample data that makes it land
   (real, recognizable companies with plausible signals — never "Acme Corp"), and anything that
   must be hidden or disabled so nothing breaks live.

Additionally, specify the assets a fundraise needs and how they inherit the design system:
- An OG/social card template (1200x630) — dark, wordmark, one line of positioning, one product
  fragment.
- A pitch-deck screenshot set: which crops, what sample data, what resolution, and the rule that
  screenshots are always taken at 2x with the real UI, never mocked up in Figma.
- A 20-second product loop: the score-running sequence into the result, no cursor, no chrome.

Be direct. Tell me what is genuinely not good enough yet.
```

---

## Product-owner notes worth keeping in view

These are judgment calls baked into the prompts above. Override them deliberately, not accidentally.

| Decision | Why |
|---|---|
| Dark stays the product default | It's your identity, it suits data density, and it differentiates from every white-and-blue SaaS tool. Apple's *foundations* transfer; Apple's *palette* does not. |
| Lime is used sparingly, mostly as indicator not fill | `#dfff00` is a loud color. Its power comes from scarcity — a lime bar on the active nav item reads premium; six lime buttons on one screen read cheap. |
| Bands are semantic-only, forever | The moment green/amber/grey means anything other than HOT/WARM/COLD, the product's core language stops being readable at a glance. |
| Text on lime is `#08090a`, never white | `--primary-foreground: #ffffff` in `globals.css` is a real contrast bug — white on `#dfff00` is roughly 1.3:1. |
| One shadow, floating layers only | This single rule does more for perceived quality than any other change in the pack. |
| Every screen answers "what next?" | This is a sales tool. Analytics without a recommended action is a dashboard, and dashboards churn. |
| Coming-soon states are designed, not hidden | Autopilot and API Keys as confident placeholders read stronger than half-built features — to users and to investors. |

**One inconsistency to fix in the repo while you're here:** `design-reference/DESIGN-DIRECTION.md`
still describes the primary as violet with cyan accents. The code moved to lime. Anyone (or any
agent) reading that doc will build the wrong thing.
