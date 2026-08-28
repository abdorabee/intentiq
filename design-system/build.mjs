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
