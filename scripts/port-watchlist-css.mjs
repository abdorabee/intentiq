import fs from "fs";

const html = fs.readFileSync("IntentIQ Watchlist.html", "utf8");
const m = html.match(/<style>([\s\S]*?)<\/style>/);
if (!m) throw new Error("No style block found");
let css = m[1];

const lines = css.split("\n");
const out = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith(".") &&
    trimmed.includes("{") &&
    !trimmed.startsWith(".watchlist-page")
  ) {
    const indent = line.match(/^(\s*)/)[1];
    const brace = trimmed.indexOf("{");
    const selectors = trimmed.slice(0, brace).trim();
    const rest = trimmed.slice(brace);
    const prefixed = selectors
      .split(",")
      .map((s) => `.watchlist-page ${s.trim()}`)
      .join(", ");
    out.push(`${indent}${prefixed} ${rest}`);
  } else if (trimmed.startsWith("@media")) {
    out.push(line);
  } else {
    out.push(line);
  }
}
css = out.join("\n");

const shellRules = `
.watchlist-page {
  flex: 1;
  min-height: 0;
  padding-bottom: 24px;
}
`;

const globals = fs.readFileSync("app/globals.css", "utf8");
const marker = "/* end Billing CSS */";
const endBilling = globals.indexOf(marker);
if (endBilling === -1) throw new Error("Billing CSS end marker not found");
const insertAt = endBilling + marker.length;

const existing = globals.indexOf("/* ── Watchlist page CSS");
if (existing !== -1) {
  const endWl = globals.indexOf("/* end Watchlist CSS */", existing);
  if (endWl === -1) throw new Error("Watchlist CSS end marker not found");
  const before = globals.slice(0, existing);
  const after = globals.slice(endWl + "/* end Watchlist CSS */".length);
  const wrapped = buildBlock(shellRules, css);
  fs.writeFileSync("app/globals.css", before + wrapped + after);
} else {
  const wrapped = buildBlock(shellRules, css);
  fs.writeFileSync("app/globals.css", globals.slice(0, insertAt) + "\n" + wrapped + globals.slice(insertAt));
}

function buildBlock(shellRules, css) {
  return `/* ── Watchlist page CSS (ported from IntentIQ Watchlist.html) — unlayered ── */
${shellRules}
${css}

.watchlist-page button.wl-tab {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  font-family: inherit;
  margin: 0;
}
.watchlist-page button.wl-icon-btn {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
}
.watchlist-page .quick-add-input {
  appearance: none;
  -webkit-appearance: none;
}

/* end Watchlist CSS */
`;
}

console.log("Updated watchlist CSS");
