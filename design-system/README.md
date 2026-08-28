# VesperWise design system — Claude Design bundle

Generated preview cards describing VesperWise's real visual system, ready to push into a
[Claude Design](https://claude.ai/design) design-system project so design work starts from the
shipped system instead of re-deriving it from 9,000 lines of CSS.

```
design-system/
  build.mjs          generator — parses tokens from the app, renders the cards
  templates/         the page shell every card is rendered into
  fragments/         hand-authored card bodies (edit these)
  claude/            generated output (do not edit — push this)
```

## Regenerating

```bash
node design-system/build.mjs
```

No dependencies, no build step, no network. It re-reads the app's own CSS every run, so the
bundle cannot drift from what ships.

The build **fails** if any hex literal in the output does not trace back to a token in
`app/theme-overrides.css`, to the preview chrome, or to the short allowlist of colours the app
itself hardcodes. Use `var(--token)` in fragments; if you genuinely need a new literal, add it to
`APP_HARDCODED` in `build.mjs` with a note saying where it comes from.

## Pushing to Claude Design

`DesignSync` needs a one-time authorization that can only be granted from an **interactive**
Claude Code session on your own machine — it cannot run in a cloud/web session.

```bash
git pull
/design-login                                        # one time
/design-sync design-system/claude --create "VesperWise"
```

The target must be a project of type `PROJECT_TYPE_DESIGN_SYSTEM`. That type is fixed at
creation: pushing into an ordinary project will not convert it. Cards register themselves from
the `<!-- @dsCard group="…" -->` marker on line 1 of each file, so nothing needs registering by
hand. Re-syncing later is the same command and is incremental.

## What's in the bundle

| Group | Cards |
|---|---|
| Foundations | Brand · Semantic tokens · Typography · Spacing & radius · Elevation & glass |
| Components | Button · Badge · Card · Input & Label · Select · Dialog · Toast |
| App patterns | Sidebar · Topbar & page head · KPI tile · Intent bands & scores · Data rows |

Every card renders the dark and light palettes side by side. Dark is the app default
(`<html class="dark">` in `app/layout.tsx`).

## Where the tokens come from

`app/theme-overrides.css` is the **effective source of truth**. `app/layout.tsx` imports it after
`globals.css`, so it wins by source order. Editing the `:root` / `.dark` blocks near the top of
`globals.css` has no visible effect — those still hold a stale violet oklch palette from before
the brand moved to yellow.

The build additionally reads `--radius` and the `@theme inline` ramp from `globals.css`.

## Fixed here

**Brand-as-text contrast (light mode).** `#dfff00` was used as a *foreground* colour in ~50 places
— the `link` variants of Button and Badge, the KPI credits/velocity icon tints, the sidebar "Top
up" link, and many ported dashboard classes. On white that measures **1.14:1** against a 4.5:1 AA
floor.

The fix is a role split. `--brand` keeps `#dfff00` and is for fills, borders and glows.
`--brand-ink` is for text and icons: it tracks `--brand` in dark mode (18.4:1 on near-black) and
drops to `#5f6d00` in light. That olive was chosen by measuring against every light surface the
app actually paints on — `#ffffff`, `#f7f8fa`, `#eef1f6`, and the `--brand-soft` wash — for a
worst case of **5.05:1**. (`#6b7a00` was the first candidate and fails at 4.21:1 on `#eef1f6`;
`--brand-active` `#c8e600` is only 1.42:1.)

Two surfaces deliberately keep raw `#dfff00` as text because they are hardcoded dark in both
themes and never turn light: `.code-surface` syntax highlighting, and the onboarding wizard.

`--color-brand-ink` is registered in `@theme inline`, so `text-brand-ink` works as a Tailwind
utility.

**One wrinkle worth knowing.** `globals.css:568-569` declares `a { color: inherit }` and
`button { color: inherit }` *outside any `@layer`*. Unlayered CSS beats layered CSS regardless of
specificity, and Tailwind v4 emits utilities into `@layer utilities` — so **no colour utility
applies to an `<a>` or a `<button>` in this app**. Measured, not assumed:
`text-brand-ink` on a `<span>` resolves to the token; on a `<button>` or `<a>` it resolves to the
inherited colour.

That is why Button's and Badge's `link` variants use the important modifier
(`text-brand-ink!`). It also means the previous `text-primary` on those variants was inert on
`<button>` and on `asChild` anchors — the link variant was never actually brand-coloured there,
only on Badge's default `<span>`.

The real fix is to move those two resets into `@layer base`, where Tailwind's own preflight lives,
so utilities win normally. That is left alone deliberately: it changes precedence for every
`<a>` and `<button>` in the app at once, which is not something to bundle into a contrast fix.

## Known debt, documented rather than fixed

These are real and are called out on the cards that touch them. None is fixed here — a design
system sync is the wrong change to bundle them into.

1. **Three `--r-*` radius scales.** `globals.css` ~L533 declares 4/6/8/12/16; ~L8446 re-declares
   the same names as 6/8/12/16/22/28 inside `@layer base`. The second shadows the first, so
   `--r-sm` is 8px. Ported CSS written against the old numbers renders one step rounder than
   intended.
2. **Contradictory `--primary-foreground`.** `globals.css` `.dark` sets `#ffffff`, which fails
   contrast on yellow. `theme-overrides.css` corrects it to `#000000` and wins.
3. **Brand yellow hardcoded past `var(--brand)`** in `components/ui/button.tsx:12` (glow shadow),
   `.text-gradient`, `::selection`, and the `.app` radial gradients. Changing the brand token
   alone will not move them.
4. **Unlayered `a` / `button` resets defeat every colour utility.** `globals.css:568-569` sit
   outside any `@layer`, so `text-*` utilities never apply to anchors or buttons. Worked around
   with the important modifier where it mattered; the real fix is to move them into
   `@layer base`.
5. **Two card components and two primary buttons.** `components/ui/card.tsx` (18px, translucent,
   blurred) and the ported `.card` (solid, `--r-lg`); `Button` (`rounded-full`) and `.btn-primary`
   (`--r-md`). Match whichever surface surrounds your work.
6. **Naming split.** The package is `intentiq`, tokens are `--iq-*`, the theme storage key is
   `intentiq-theme` — the product is **VesperWise**.

## Related

- `design-reference/DESIGN-DIRECTION.md` — layout, density and anti-pattern guidance
- `design-reference/FIGMA.md` — the Figma source file
- Root `IntentIQ *.html` mocks — the original visual source of truth
