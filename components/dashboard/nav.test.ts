import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navSource = readFileSync(new URL("./nav.tsx", import.meta.url), "utf8");
const shellSource = readFileSync(
  new URL("./dashboard-shell.tsx", import.meta.url),
  "utf8"
);

describe("dashboard profile navigation cleanup", () => {
  it("omits Profile and Memory from the shared dashboard navigation", () => {
    expect(navSource).not.toMatch(/href:\s*["']\/memory["']/);
    expect(navSource).not.toMatch(/label:\s*["']Profile["']/);
  });

  it("uses the same navigation for expanded, collapsed, and mobile drawer modes", () => {
    expect(shellSource.match(/<DashboardNav\b/g)).toHaveLength(1);
    expect(shellSource).toContain("collapsed={effectiveCollapsed}");
    expect(shellSource).toContain('mobileOpen ? " nav-open" : ""');
    expect(shellSource).toContain("const effectiveCollapsed = isMobile ? false : collapsed");
  });

  it("keeps direct profile, standalone onboarding, and settings access in place", () => {
    expect(existsSync(new URL("../../app/(dashboard)/memory/page.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../../app/onboarding/page.tsx", import.meta.url))).toBe(true);

    const settingsSource = readFileSync(
      new URL("../../app/(dashboard)/settings/page.tsx", import.meta.url),
      "utf8"
    );
    expect(settingsSource).toContain('redirect("/memory")');
  });
});
