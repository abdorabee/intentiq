import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navSource = readFileSync(new URL("./nav.tsx", import.meta.url), "utf8");
const shellSource = readFileSync(
  new URL("./dashboard-shell.tsx", import.meta.url),
  "utf8"
);
const searchSource = readFileSync(
  new URL("../../lib/dashboard-search.ts", import.meta.url),
  "utf8"
);
const memorySource = readFileSync(
  new URL("../../app/(dashboard)/memory/page.tsx", import.meta.url),
  "utf8"
);
const settingsSource = readFileSync(
  new URL("../../app/(dashboard)/settings/page.tsx", import.meta.url),
  "utf8"
);
const sellingPageUrl = new URL(
  "../../app/(dashboard)/settings/selling/page.tsx",
  import.meta.url
);

describe("dashboard navigation", () => {
  it("omits Memory href and Profile label from the shared sidebar", () => {
    expect(navSource).not.toMatch(/href:\s*["']\/memory["']/);
    expect(navSource).not.toMatch(/label:\s*["']Profile["']/);
    expect(navSource).not.toMatch(/\[MEMORY\]/);
  });

  it("includes Settings as a real Account item", () => {
    expect(navSource).toMatch(/href:\s*["']\/settings["']/);
    expect(navSource).toMatch(/label:\s*["']Settings["']/);
  });

  it("renders labeled Workspace, Accounts, Operations, and Account sections", () => {
    expect(navSource).toContain('label: "Workspace"');
    expect(navSource).toContain('label: "Accounts"');
    expect(navSource).toContain('label: "Operations"');
    expect(navSource).toContain("<span>Account</span>");
  });

  it("uses the same navigation for expanded, collapsed, and mobile drawer modes", () => {
    expect(shellSource.match(/<DashboardNav\b/g)).toHaveLength(1);
    expect(shellSource).toContain("collapsed={effectiveCollapsed}");
    expect(shellSource).toContain('mobileOpen ? " nav-open" : ""');
    expect(shellSource).toContain("const effectiveCollapsed = isMobile ? false : collapsed");
  });

  it("makes the user row a working menu with Settings, Appearance, and Sign out", () => {
    expect(navSource).toContain('aria-haspopup="menu"');
    expect(navSource).toContain('href="/settings"');
    expect(navSource).toContain("Appearance");
    expect(navSource).toContain("onToggleTheme");
    expect(navSource).toContain("SignOutButton");
    expect(navSource).toContain("Sign out");
    expect(navSource).not.toContain("ws-chev");
  });

  it("redirects /memory to the selling profile settings page", () => {
    expect(memorySource).toContain('redirect("/settings/selling")');
    expect(settingsSource).toContain('redirect("/settings/selling")');
    expect(settingsSource).not.toContain('redirect("/memory")');
  });

  it("keeps the relocated selling profile editor at /settings/selling", () => {
    expect(existsSync(sellingPageUrl)).toBe(true);
    const sellingSource = readFileSync(sellingPageUrl, "utf8");
    expect(sellingSource).toContain("/api/user/profile");
    expect(sellingSource).not.toContain("[MEMORY]");
  });

  it("does not register Memory in the search registry", () => {
    expect(searchSource).not.toMatch(/href:\s*["']\/memory["']/);
    expect(searchSource).not.toMatch(/id:\s*["']memory["']/);
    expect(searchSource).toMatch(/href:\s*["']\/settings["']/);
  });

  it("maps breadcrumbs away from Memory and includes Inbox and Settings", () => {
    const topbarSource = readFileSync(
      new URL("./dashboard-topbar.tsx", import.meta.url),
      "utf8"
    );
    expect(topbarSource).not.toMatch(/["']\/memory["']/);
    expect(topbarSource).toContain('"/inbox"');
    expect(topbarSource).toContain('current: "Settings"');
    expect(topbarSource).toContain('current: "Selling profile"');
  });
});
