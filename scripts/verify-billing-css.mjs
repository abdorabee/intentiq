import fs from "fs";
import path from "path";

const html = fs.readFileSync("IntentIQ Billing.html", "utf8");
const globals = fs.readFileSync("app/globals.css", "utf8");
const billingDir = "components/billing";

const htmlClasses = new Set();
for (const m of html.matchAll(/class="([^"]+)"/g)) {
  for (const cls of m[1].split(/\s+/)) {
    if (cls) htmlClasses.add(cls);
  }
}

const componentFiles = fs
  .readdirSync(billingDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => path.join(billingDir, f));

const componentClasses = new Set();
for (const file of componentFiles) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/className="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls && !cls.includes("${")) componentClasses.add(cls);
    }
  }
  for (const m of src.matchAll(/className=\{`([^`]+)`\}/g)) {
    for (const part of m[1].split(/\s+/)) {
      const base = part.replace(/\$\{.*?\}/g, "").trim();
      if (base) componentClasses.add(base);
    }
  }
}

const billingBlockStart = globals.indexOf("/* ── Billing page CSS");
const billingBlock = billingBlockStart >= 0 ? globals.slice(billingBlockStart) : "";

const missingInGlobals = [...componentClasses].filter((cls) => {
  if (cls.includes("active") || cls.includes("current") || cls.includes("recommended")) return false;
  const rule = `.billing-page .${cls}`;
  const ruleAlt = `.billing-page .${cls.split(" ")[0]}`;
  return !billingBlock.includes(rule) && !billingBlock.includes(ruleAlt);
});

const missingInComponents = [...htmlClasses].filter(
  (cls) =>
    !componentClasses.has(cls) &&
    !["app", "main", "topbar", "crumb", "spacer", "notif", "sidebar", "sb-item", "active"].includes(cls) &&
    !cls.startsWith("sb-") &&
    !cls.startsWith("ws-") &&
    cls !== "ic" &&
    cls !== "kbd" &&
    cls !== "chev" &&
    cls !== "sep" &&
    cls !== "current" &&
    cls !== "mono",
);

console.log("Billing CSS verify");
console.log("  Component classes:", componentClasses.size);
console.log("  Missing billing rules in globals.css:", missingInGlobals.length);
if (missingInGlobals.length) console.log("   ", missingInGlobals.slice(0, 20).join(", "));
console.log("  HTML classes not in components (sample):", missingInComponents.slice(0, 15).join(", "));

if (missingInGlobals.length > 30) process.exitCode = 1;
