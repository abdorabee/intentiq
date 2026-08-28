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
const settingsLayoutUrl = new URL(
  "../../app/(dashboard)/settings/layout.tsx",
  import.meta.url
);
const appearancePageUrl = new URL(
  "../../app/(dashboard)/settings/appearance/page.tsx",
  import.meta.url
);
const experiencePageUrl = new URL(
  "../../app/(dashboard)/settings/experience/page.tsx",
  import.meta.url
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

  it("makes the user row a working disclosure with Settings, Appearance, and Sign out", () => {
    expect(navSource).toContain('aria-haspopup="true"');
    expect(navSource).toContain("aria-expanded={open}");
    expect(navSource).toContain("aria-controls={open ? menuId : undefined}");
    expect(navSource).not.toContain('aria-haspopup="menu"');
    expect(navSource).not.toContain('role="menu"');
    expect(navSource).not.toContain('role="menuitem"');
    expect(navSource).toContain('href="/settings"');
    expect(navSource).toContain("Appearance");
    expect(navSource).toContain("onToggleTheme");
    expect(navSource).toContain("SignOutButton");
    expect(navSource).toContain("Sign out");
    expect(navSource).not.toContain("ws-chev");
  });

  it("restores focus to the account trigger on Escape", () => {
    expect(navSource).toMatch(/if \(event\.key !== "Escape"\) return;/);
    expect(navSource).toContain("setOpen(false)");
    expect(navSource).toContain("triggerRef.current?.focus()");
  });

  it("redirects /memory to the selling profile settings page", () => {
    expect(memorySource).toContain('redirect("/settings/selling")');
    expect(settingsSource).not.toContain('redirect("/settings/selling")');
    expect(settingsSource).not.toContain('redirect("/memory")');
  });

  it("lands /settings on Account instead of redirecting to Memory", () => {
    expect(settingsSource).toMatch(/UserProfile|AccountRoleEditor|role/);
    expect(settingsSource).not.toContain("redirect(");
  });

  it("keeps a shared settings layout and the relocated selling editor", () => {
    expect(existsSync(settingsLayoutUrl)).toBe(true);
    expect(existsSync(sellingPageUrl)).toBe(true);
    expect(existsSync(appearancePageUrl)).toBe(true);
    expect(existsSync(experiencePageUrl)).toBe(true);
    const layoutSource = readFileSync(settingsLayoutUrl, "utf8");
    const sellingSource = readFileSync(sellingPageUrl, "utf8");
    expect(layoutSource).toContain("SETTINGS_NAV_ITEMS");
    expect(layoutSource).toContain("<select");
    expect(sellingSource).toContain("/api/user/profile");
    expect(sellingSource).not.toContain("[MEMORY]");
    expect(sellingSource).not.toContain("cyan-");
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
    expect(topbarSource).toContain('current: "Appearance"');
    expect(topbarSource).toContain('current: "Experience"');
  });
});
