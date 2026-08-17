import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navSource = readFileSync(new URL("./nav.tsx", import.meta.url), "utf8");
const shellSource = readFileSync(
  new URL("./dashboard-shell.tsx", import.meta.url),
  "utf8"
);

describe("dashboard settings navigation", () => {
  it("omits Profile and Memory from the shared dashboard navigation", () => {
    expect(navSource).not.toMatch(/href:\s*["']\/memory["']/);
    expect(navSource).not.toMatch(/label:\s*["']Profile["']/);
  });

  it("links to the real Settings page and a wired-up API Keys page", () => {
    expect(navSource).toMatch(/href:\s*"\/settings",\s*label:\s*"Settings"/);
    expect(navSource).toMatch(/\{\s*href:\s*"\/api-keys",\s*label:\s*"API Keys",\s*icon:\s*Key\s*\}/);
  });

  it("uses the same navigation for expanded, collapsed, and mobile drawer modes", () => {
    expect(shellSource.match(/<DashboardNav\b/g)).toHaveLength(1);
    expect(shellSource).toContain("collapsed={effectiveCollapsed}");
    expect(shellSource).toContain('mobileOpen ? " nav-open" : ""');
    expect(shellSource).toContain("const effectiveCollapsed = isMobile ? false : collapsed");
  });

  it("renders a real Settings page instead of redirecting, and keeps /memory deep-links alive", () => {
    expect(existsSync(new URL("../../app/(dashboard)/memory/page.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../../app/(dashboard)/onboarding/page.tsx", import.meta.url))).toBe(true);

    const settingsSource = readFileSync(
      new URL("../../app/(dashboard)/settings/page.tsx", import.meta.url),
      "utf8"
    );
    expect(settingsSource).not.toContain("redirect(");
    expect(settingsSource).toContain("SettingsView");

    const memorySource = readFileSync(
      new URL("../../app/(dashboard)/memory/page.tsx", import.meta.url),
      "utf8"
    );
    expect(memorySource).toContain('redirect("/settings');
  });
});
