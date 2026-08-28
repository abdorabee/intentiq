#!/usr/bin/env node
/**
 * Generates the Claude Design bundle in design-system/claude/ from the
 * app's real token sources. No colour is ever typed by hand here: the
 * palettes are parsed out of app/theme-overrides.css, which is the file
 * that actually wins at runtime (it is imported after globals.css).
 *
 * Usage: node design-system/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const FRAGMENTS = join(HERE, "fragments");
const OUT = join(HERE, "claude");

const read = (p) => readFileSync(join(ROOT, p), "utf8");

/* ---------- token extraction ---------- */

/** Bodies of every top-level `selector { … }` rule (closing brace in column 0). */
function topLevelBlocks(css, selector) {
  const re = new RegExp(
    "^" + selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{\\r?\\n([\\s\\S]*?)^\\}",
    "gm"
  );
  return [...css.matchAll(re)].map((m) => m[1]);
}

/** The single top-level `selector { … }` rule. Throws if absent. */
function topLevelBlock(css, selector, sourceName) {
  const blocks = topLevelBlocks(css, selector);
  if (!blocks.length) throw new Error(`Could not find "${selector} { … }" in ${sourceName}`);
  return blocks[0];
}

/** Pull `--name: value;` declarations out of a block, dropping comments and non-custom props. */
function declarations(block) {
  const out = [];
  for (const raw of block.split("\n")) {
    const line = raw.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const m = line.match(/^(--[a-z0-9-]+)\s*:\s*(.+?);$/i);
    if (m) out.push([m[1], m[2].trim()]);
  }
  return out;
}

const overrides = read("app/theme-overrides.css");
const globals = read("app/globals.css");

const light = declarations(topLevelBlock(overrides, ":root", "app/theme-overrides.css"));
const dark = declarations(topLevelBlock(overrides, ".dark", "app/theme-overrides.css"));

// --radius lives in one of several top-level :root blocks in globals.css
// (the first is the --iq-* reference palette); the @theme ramp derives from it.
const radiusBase = topLevelBlocks(globals, ":root")
  .flatMap(declarations)
  .find(([k]) => k === "--radius");
if (!radiusBase) throw new Error("Could not find --radius in any app/globals.css :root block");

const themeInline = declarations(topLevelBlock(globals, "@theme inline", "app/globals.css"));
const radiusRamp = themeInline.filter(([k]) => k.startsWith("--radius-"));
const fontStacks = themeInline.filter(([k]) => k === "--font-sans" || k === "--font-mono");

// The winning --r-* scale: the later `@layer base { :root { … } }` block shadows
// the earlier one at globals.css ~L533. Take the last match, not the first.
const rScaleBlocks = [...globals.matchAll(/@layer base\s*\{\s*\r?\n\s*:root\s*\{\r?\n([\s\S]*?)\r?\n\s*\}/g)];
if (!rScaleBlocks.length) throw new Error("Could not find @layer base { :root { … } } in app/globals.css");
const rScale = declarations(rScaleBlocks[rScaleBlocks.length - 1][1]).filter(([k]) => /^--r-/.test(k));
if (!rScale.length) throw new Error("Winning @layer base :root block contained no --r-* tokens");

const common = [radiusBase, ...radiusRamp, ...rScale, ...fontStacks];

const emit = (pairs) => pairs.map(([k, v]) => `  ${k}: ${v};`).join("\n");

/* ---------- fragment discovery ---------- */

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(p));
    else if (entry.name.endsWith(".html")) found.push(p);
  }
  return found.sort();
}

function parseFragment(file) {
  const raw = readFileSync(file, "utf8");
  const metaMatch = raw.match(/^<!--@meta\r?\n([\s\S]*?)-->\r?\n?/);
  if (!metaMatch) throw new Error(`${relative(ROOT, file)} is missing its <!--@meta … --> header`);
  const meta = {};
  for (const line of metaMatch[1].split("\n")) {
    const m = line.match(/^\s*([a-z]+)\s*:\s*(.+?)\s*$/i);
    if (m) meta[m[1]] = m[2];
  }
  for (const key of ["group", "title", "subtitle", "source"]) {
    if (!meta[key]) throw new Error(`${relative(ROOT, file)} @meta is missing "${key}"`);
  }
  let body = raw.slice(metaMatch[0].length);
  let extraCss = "";
  let extraJs = "";
  // <style> and <script> are hoisted out of the body: the body is injected
  // once per theme pane, and neither should be duplicated.
  body = body.replace(/<style>([\s\S]*?)<\/style>\s*/, (_, css) => {
    extraCss = css.trim();
    return "";
  });
  body = body.replace(/<script>([\s\S]*?)<\/script>\s*/, (_, js) => {
    extraJs = `<script>\n${js.trim()}\n</` + `script>`;
    return "";
  });
  return { meta, body: body.trim(), extraCss, extraJs };
}

/* ---------- render ---------- */

const shell = readFileSync(join(HERE, "templates/shell.html"), "utf8");

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

const indent = (text, spaces) =>
  text.split("\n").map((l) => (l.trim() ? " ".repeat(spaces) + l : l)).join("\n");

const cards = [];
for (const file of walk(FRAGMENTS)) {
  const { meta, body, extraCss, extraJs } = parseFragment(file);
  const rel = relative(FRAGMENTS, file);
  const html = shell
    .replaceAll("{{GROUP}}", meta.group)
    .replaceAll("{{TITLE}}", meta.title)
    .replaceAll("{{SUBTITLE}}", meta.subtitle)
    .replaceAll("{{SOURCE}}", meta.source)
    .replaceAll("{{FRAGMENT}}", rel.split("\\").join("/"))
    .replaceAll("{{LAYOUT}}", meta.layout === "stack" ? "stack" : "")
    .replace("{{VARS_COMMON}}", emit(common))
    .replace("{{VARS_DARK}}", emit(dark))
    .replace("{{VARS_LIGHT}}", emit(light))
    .replace("{{EXTRA_CSS}}", extraCss)
    .replace("{{EXTRA_JS}}", extraJs)
    .replaceAll("{{BODY}}", indent(body, 4));

  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  cards.push({ path: `${rel.split("\\").join("/")}`, group: meta.group, title: meta.title });
}

/* ---------- colour audit ----------
 * Every hex in the bundle must trace back to a real source. Anything else is a
 * hand-typed colour and fails the build — that is the whole point of generating
 * this bundle rather than maintaining it by hand.
 */

// Preview chrome only: the page around the theme panes, deliberately neutral so
// neither palette is judged against it. Declared in templates/shell.html.
const CHROME_HEXES = new Set(["#17181a", "#e6e7e9", "#9ba0a6", "#7e838a"]);

// Colours hardcoded in the app itself, reproduced faithfully because that is
// what ships. Each is called out in the card that shows it.
const APP_HARDCODED = {
  "#141416": "components/ui/dialog.tsx — dark:bg-[#141416]/90",
  "#0a0b0f": "app/globals.css — .sb-user .av avatar ink",
};

const tokenValues = [...light, ...dark, ...common]
  .map(([, v]) => v.toLowerCase())
  .join(" ");

// Only colours that actually paint something count: <style> blocks and inline
// style="" attributes. A hex quoted in prose is documentation, not a colour.
function styleContexts(html) {
  const chunks = [];
  for (const m of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) chunks.push(m[1]);
  for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) chunks.push(m[1]);
  return chunks.join("\n");
}

const offenders = [];
for (const file of walk(OUT)) {
  const css = styleContexts(readFileSync(file, "utf8"));
  for (const hex of new Set((css.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase()))) {
    if (CHROME_HEXES.has(hex) || hex in APP_HARDCODED) continue;
    if (tokenValues.includes(hex)) continue;
    offenders.push(`${relative(ROOT, file)}: ${hex}`);
  }
}
if (offenders.length) {
  console.error("\nHand-typed colours found — use a var(--token) instead:");
  for (const o of offenders) console.error("  " + o);
  process.exit(1);
}

/* ---------- Markdown spec ----------
 * One self-contained file to hand to Claude Design (or paste into any Claude
 * conversation). Token values are emitted from the same parsed CSS as the HTML
 * cards, so this cannot drift from the app. Component geometry is authored
 * here, but every colour in it is a token NAME, never a literal.
 */

const TOKEN_GROUPS = [
  ["Brand", (k) => k.startsWith("--brand")],
  ["Surfaces & text", (k) => /^--(background|foreground|card|popover|secondary|muted|bg|surface|text-)/.test(k)],
  ["Action & state", (k) => /^--(primary|accent|destructive|border|input|ring)/.test(k)],
  ["Intent & status", (k) => /^--(hot|warm|cold|cool|success|warning|danger|info|red|cyan)/.test(k)],
  ["Charts", (k) => k.startsWith("--chart-")],
  ["Sidebar", (k) => k.startsWith("--sidebar")],
];

// A designer reading this needs a colour, not an alias chain, so resolve
// single-level var() references within the same theme.
function resolveToken(value, map, depth = 0) {
  const m = /^var\((--[a-z0-9-]+)\)$/i.exec(value?.trim() ?? "");
  if (!m || depth > 5) return value;
  const next = map.get(m[1]);
  return next === undefined ? value : resolveToken(next, map, depth + 1);
}

function tokenTable(pred) {
  const lightMap = new Map(light);
  const darkMap = new Map(dark);
  const names = [...new Set([...lightMap.keys(), ...darkMap.keys()])].filter(pred);
  if (!names.length) return "";
  const cell = (n, map) => {
    const raw = map.get(n);
    if (raw === undefined) return "—";
    const res = resolveToken(raw, map);
    return res === raw ? `\`${raw}\`` : `\`${res}\` (\`${raw}\`)`;
  };
  const rows = names.map((n) => `| \`${n}\` | ${cell(n, darkMap)} | ${cell(n, lightMap)} |`);
  return ["| Token | Dark (default) | Light |", "|---|---|---|", ...rows].join("\n");
}

const radiusRows = common
  .filter(([k]) => k.startsWith("--r-") || k === "--radius" || k.startsWith("--radius-"))
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
  .join("\n");

const md = `<!-- GENERATED by design-system/build.mjs — do not edit by hand.
     Token values are parsed from app/theme-overrides.css and app/globals.css. -->

# VesperWise Design System

B2B sales-intelligence product. Linear-inspired, data-dense, **dark by default**
(\`<html class="dark">\`); light mode is fully supported and every token flips.

Single accent: acid yellow. No secondary brand hue.

---

## 1. Brand — the one rule that matters

The brand splits by **role**, not by shade:

| Role | Token | Use |
|---|---|---|
| Fills, borders, glows | \`--brand\` | buttons, focus rings, meters, \`--chart-1\` |
| Text & icons | \`--brand-ink\` | links, tinted icon glyphs, inline labels |

\`--brand\` is \`#dfff00\` in both themes. \`--brand-ink\` tracks it in dark mode (yellow on
near-black measures **18.4:1**) and drops to a dark olive in light, because the raw brand as text
on white measures **1.14:1** — visible but unreadable. Worst case for \`--brand-ink\` across
\`#ffffff\`, \`#f7f8fa\`, \`#eef1f6\` and the \`--brand-soft\` wash is **5.05:1**.

\`--primary-foreground\` is **black**, not white. Yellow is high-luminance; white on it is ~1.1:1.
Never override that pairing.

Neither token is a status colour. Intent bands own HOT/WARM/COLD; success/warning/danger are their
own tokens.

${tokenTable(TOKEN_GROUPS[0][1])}

---

## 2. Tokens

${TOKEN_GROUPS.slice(1).map(([label, pred]) => {
  const t = tokenTable(pred);
  return t ? `### ${label}\n\n${t}` : "";
}).filter(Boolean).join("\n\n")}

---

## 3. Typography

**Inter** for UI and prose, **JetBrains Mono** for every number, domain and identifier.
Body is **13px inside the app**, **16px on the landing page**. \`font-feature-settings: "ss01", "cv11"\`.

| Role | Font | Size / weight | Tracking |
|---|---|---|---|
| Page title | Inter | 22 / 500 | -0.024em |
| Card title | Inter | 15 / 600 | -0.011em |
| Section heading | Inter | 13 / 500 | -0.011em |
| App body | Inter | 13 / 400 | -0.011em |
| Secondary / meta | Inter | 12 / 400 | -0.006em |
| Eyebrow label | Inter | 11 / 500 uppercase | 0.04em |
| KPI number | Inter | 30 / 500 | -0.035em |
| Numerics, domains | JetBrains Mono | 12–13 / 500 | — |
| Mono eyebrow | JetBrains Mono | 11 / 500 uppercase | 0.04em |

Weights: 400, 500, 600, 700 only — no 300, no 800+. Tracking tightens as size grows.

**Every numeric surface sets \`font-variant-numeric: tabular-nums\`** so columns of scores align.
The 30px KPI number is the one deliberate exception to "numbers are mono" — it is sans, because
Inter's tighter tracking reads better at that size; the delta beside it stays mono.

---

## 4. Spacing, radius, elevation

Spacing is a **4px grid**: 4, 6, 8, 12, 16, 20, 28.
Page body \`padding: 20px 28px 40px\`. Card heads \`14px 18px\`, bodies \`16px 18px\`. Table rows \`10px 16px\`.

### Radius

| Token | Value |
|---|---|
${radiusRows}

⚠️ Three \`--r-*\` scales are declared in \`globals.css\`; the later one wins, so \`--r-sm\` is 8px,
not the 4px an earlier block declares. The values above are the live ones. Buttons, badges, bands
and avatars use \`999px\` — a pill, size-independent.

### Elevation

Depth is a hairline ring plus a soft drop, never a heavy shadow. \`--shadow-glow\` is the only
coloured one — reserve it for a brand-filled element that needs to read as active.

${tokenTable((k) => k.startsWith("--shadow"))}

---

## 5. Components

7 primitives (shadcn "new-york", \`baseColor: neutral\`, CSS variables). Colours below are token
names; resolve them from the tables above.

| Component | Geometry | Notes |
|---|---|---|
| **Button** | h 40 (xs 28 / sm 36 / lg 44), \`999px\`, 13px/600 | 6 variants: default (\`--primary\` fill, \`--primary-foreground\` text, inset highlight + brand glow), secondary, outline, ghost, destructive, link (\`--brand-ink\`). Hover lifts 1px. Focus: 3px \`--ring\` at 30%. Disabled 45%. |
| **Badge** | min-h 22, pad 2/10, \`999px\`, 11.5px/600 | Same 6 variants. Renders a \`<span>\`; hover styles only apply via \`asChild\` on an anchor. |
| **Card** | radius 18, pad 22, \`--card\` at 85% + blur | Inset top highlight. In dark it floats on a white alpha, so it needs a non-flat background behind it. |
| **Input** | h 40, radius \`--radius-xl\`, pad 8/14 | \`--input\` border, translucent fill. Focus 3px \`--ring\` at 30%. Label 13px/500. |
| **Select** | h 36 (sm 32), radius \`--radius-md\` | Still on stock shadcn geometry — reads a step tighter than Input/Button. Content on \`--popover\`. |
| **Dialog** | radius 24, pad 24, heavy blur | Overlay blurs the page rather than only dimming it. Destructive action on the right, named in mono. |
| **Toast** | radius \`--radius-lg\` | Sonner on \`--popover\`. Icons: success/info/warning/error/loading. |

---

## 6. App patterns

These are the ported semantic classes the dashboard actually renders with.

- **Sidebar** — 232px (56px collapsed, hidden under 1100px). Items 13px, pad 5/10, \`--r-sm\`,
  \`--text-secondary\`. Hover and active are washes one step apart, **never the brand** — with a
  dozen rows on screen a yellow block would dominate. Attention comes from counts and the HOT dot.
- **Topbar** — 44px, breadcrumb left, exactly one primary action rightmost.
- **Page head** — 22px title + 13px sub, filters right, hairline underneath.
- **KPI tile** — 4 across (2 under 1100px). Tinted icon, 30px sans number, mono delta
  (up \`--hot\`, down \`--danger\`), optional sparkline.
- **Intent bands** — the core product vocabulary. Always mono, uppercase, dot-prefixed, pill-shaped.
  Never a plain Badge.

| Band | Score | Token |
|---|---|---|
| HOT | ≥ 75 | \`--hot\` |
| WARM | ≥ 50 | \`--warm\` |
| COLD | < 50 | \`--cold\` |

  HOT is **green**, not brand yellow — the accent belongs to actions, not status. A yellow score
  would read as a button. Score numbers take the band colour, never \`--text-primary\`.

- **Data rows** — fixed grid columns so scores align down the column. 34px header (11px uppercase),
  rows 10/16 with hairline separators, hover is a hint not a highlight. Mono identifiers with the
  company name 11px beneath. Five signal dots in fixed order (funding, hiring, news, technology,
  web) so an unlit position always means the same missing source.

---

## 7. Rules and traps

1. **\`--brand\` fills, \`--brand-ink\` writes.** Never set \`color\` to \`--brand\`, \`--accent\`,
   \`--accent-2\` or \`--cyan\`.
2. **Two surfaces stay dark in both themes** and keep raw \`#dfff00\` as text: the
   \`.code-surface\` syntax highlighting and the onboarding wizard. The olive would be wrong there.
3. **Ported semantic classes beat Tailwind utilities.** \`.btn-primary\`, \`.tb-btn\`, \`.sb-item\`
   and friends are unlayered; utilities live in \`@layer utilities\` and lose. Inside ported markup
   use the ported class, not a utility.
4. **Tokens are edited in \`app/theme-overrides.css\`**, which is imported after \`globals.css\` and
   wins. The \`:root\`/\`.dark\` blocks near the top of \`globals.css\` still hold a stale violet
   palette and have no effect.
5. **No emoji as icons** — Lucide or inline SVG.
6. **Never invent new band colours** or drop HOT/WARM/COLD from score UI.
7. Anything numeric is mono and tabular.
`;

writeFileSync(join(HERE, "VESPERWISE-DESIGN-SYSTEM.md"), md);

/* ---------- report ---------- */

const byGroup = cards.reduce((acc, c) => {
  (acc[c.group] ||= []).push(c);
  return acc;
}, {});

console.log(`Tokens: ${light.length} light, ${dark.length} dark, ${common.length} shared`);
console.log(`Wrote ${cards.length} cards to ${relative(ROOT, OUT)}/`);
for (const [group, list] of Object.entries(byGroup)) {
  console.log(`  ${group} (${list.length})`);
  for (const c of list) console.log(`    ${c.path.padEnd(34)} ${c.title}`);
}
