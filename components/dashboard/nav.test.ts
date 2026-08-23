import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shellSource = readFileSync(
  new URL("./dashboard-shell.tsx", import.meta.url),
  "utf8"
);

describe("dashboard navigation shell", () => {
  it("uses the same navigation for expanded, collapsed, and mobile drawer modes", () => {
    expect(shellSource.match(/<DashboardNav\b/g)).toHaveLength(1);
    expect(shellSource).toContain("collapsed={effectiveCollapsed}");
    expect(shellSource).toContain('mobileOpen ? " nav-open" : ""');
    expect(shellSource).toContain("const effectiveCollapsed = isMobile ? false : collapsed");
  });
});
