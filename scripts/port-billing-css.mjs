import fs from "fs";

const html = fs.readFileSync("IntentIQ Billing.html", "utf8");
const m = html.match(/<style>([\s\S]*?)<\/style>/);
if (!m) throw new Error("No style block found");
let css = m[1];

// Omit annual billing toggle (not in app)
css = css.replace(/\.cycle-toggle[\s\S]*?(?=\.plans-grid)/, "");

const lines = css.split("\n");
const out = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith(".") &&
    trimmed.includes("{") &&
    !trimmed.startsWith(".billing-page")
  ) {
    const indent = line.match(/^(\s*)/)[1];
    const brace = trimmed.indexOf("{");
    const selectors = trimmed.slice(0, brace).trim();
    const rest = trimmed.slice(brace);
    const prefixed = selectors
      .split(",")
      .map((s) => `.billing-page ${s.trim()}`)
      .join(", ");
    out.push(`${indent}${prefixed} ${rest}`);
  } else if (trimmed.startsWith("@media")) {
    out.push(line);
  } else {
    out.push(line);
  }
}
css = out.join("\n");

// @media rules are already prefixed by the line loop above

const shellRules = `
/* page-flush fill + reset landing .section-head leakage */
.billing-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.billing-page .section-head {
  max-width: none;
  width: 100%;
  text-align: left;
  margin: 26px 2px 12px;
}
.billing-page .section-head .h,
.billing-page .section-head .s {
  margin-top: 0;
  max-width: none;
}
.billing-page .section-head .h {
  font-size: 13px;
  font-weight: 600;
}
.billing-page .section-head .s {
  font-size: 12px;
  margin-top: 2px;
}
`;

const globals = fs.readFileSync("app/globals.css", "utf8");
const start = globals.indexOf("/* ── Billing page CSS");
if (start === -1) throw new Error("Billing CSS block not found");
const end = globals.indexOf("/* end Billing CSS */", start) + "/* end Billing CSS */".length;

// Unlayered: must beat landing .section-head and history .panel (also unlayered).
const wrapped = `/* ── Billing page CSS (ported from IntentIQ Billing.html) — unlayered ── */
${shellRules}
${css}

/* form reset for plan/topup CTAs */
.billing-page form { margin: 0; }
.billing-page button.pc-cta,
.billing-page a.pc-cta { display: block; text-decoration: none; border: none; font-family: inherit; cursor: pointer; }
.billing-page button.tu-cta {
  font-family: inherit;
  width: 100%;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}
.billing-page .plan-card-c { cursor: default; }
.billing-page .plan-card-c .pc-cta,
.billing-page .plan-card-c form { cursor: pointer; }
.billing-page .help-row .tb-btn { flex-shrink: 0; cursor: pointer; }
.billing-page button.range-tab {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  font-family: inherit;
  padding: 4px 10px;
  margin: 0;
}
.billing-page button.tb-btn {
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
}

/* end Billing CSS */
`;

fs.writeFileSync("app/globals.css", globals.slice(0, start) + wrapped + globals.slice(end));
console.log("Updated billing CSS:", wrapped.length, "bytes");
