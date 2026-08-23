import { describe, expect, it } from "vitest";

import * as navigation from "./dashboard-search";

type NavigationContract = {
  NAVIGATION_GROUPS?: ReadonlyArray<{
    id: string;
    label: string;
    items: ReadonlyArray<{ href: string; label: string }>;
  }>;
  getVisibleNavigationGroups?: () => Array<{
    id: string;
    label: string;
    items: Array<{ href: string; label: string }>;
  }>;
  isNavigationItemActive?: (
    item: { href: string; activePaths?: readonly string[] },
    pathname: string,
  ) => boolean;
};

const contract = navigation as unknown as NavigationContract;

describe("canonical dashboard navigation", () => {
  it("groups the available product destinations in the approved order", () => {
    expect(contract.getVisibleNavigationGroups).toBeTypeOf("function");
    if (!contract.getVisibleNavigationGroups) return;

    expect(contract.getVisibleNavigationGroups().map((group) => ({
      label: group.label,
      items: group.items.map((item) => item.label),
    }))).toEqual([
      { label: "Workspace", items: ["Dashboard", "Intent Hub", "Score"] },
      { label: "Research", items: ["People", "Watchlist", "Lists", "History"] },
      { label: "Automation", items: ["Bulk Score"] },
      { label: "Utilities", items: ["Inbox", "Settings"] },
    ]);
  });

  it("keeps gated future destinations in the manifest without exposing them", () => {
    expect(contract.NAVIGATION_GROUPS).toBeDefined();
    expect(contract.getVisibleNavigationGroups).toBeTypeOf("function");
    if (!contract.NAVIGATION_GROUPS || !contract.getVisibleNavigationGroups) return;

    const registered = contract.NAVIGATION_GROUPS.flatMap((group) => group.items);
    const visible = contract.getVisibleNavigationGroups().flatMap((group) => group.items);

    expect(registered.map((item) => item.href)).toContain("/assistant");
    expect(registered.map((item) => item.href)).toContain("/autopilot");
    expect(visible.map((item) => item.href)).not.toContain("/assistant");
    expect(visible.map((item) => item.href)).not.toContain("/autopilot");
  });

  it("derives command-palette pages from the available manifest", () => {
    expect(navigation.SEARCH_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/dashboard",
      "/pipeline",
      "/score",
      "/people",
      "/watchlist",
      "/lists",
      "/history",
      "/bulk",
      "/inbox",
      "/settings",
    ]);
    expect(navigation.filterNavItems("billing").map((item) => item.href)).toEqual([
      "/settings",
    ]);
    expect(navigation.filterNavItems("memory")).toEqual([]);
  });

  it("matches exact, descendant, and settings-owned active routes", () => {
    expect(contract.isNavigationItemActive).toBeTypeOf("function");
    if (!contract.isNavigationItemActive) return;

    expect(contract.isNavigationItemActive({ href: "/dashboard" }, "/dashboard")).toBe(true);
    expect(contract.isNavigationItemActive({ href: "/dashboard" }, "/dashboard/summary")).toBe(false);
    expect(contract.isNavigationItemActive({ href: "/lists" }, "/lists/abc")).toBe(true);
    expect(contract.isNavigationItemActive(
      { href: "/settings", activePaths: ["/settings", "/billing", "/api-keys"] },
      "/settings/business-profile",
    )).toBe(true);
    expect(contract.isNavigationItemActive(
      { href: "/settings", activePaths: ["/settings", "/billing", "/api-keys"] },
      "/billing",
    )).toBe(true);
  });
});
