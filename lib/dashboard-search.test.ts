import { describe, expect, it } from "vitest";

import * as navigation from "./dashboard-search";

describe("canonical dashboard navigation", () => {
  it("groups the available product destinations in the approved order", () => {
    expect(navigation.getVisibleNavigationGroups().map((group) => ({
      label: group.label,
      items: group.items.map((item) => item.label),
    }))).toEqual([
      { label: "Workspace", items: ["Dashboard", "Intent Hub", "Score"] },
      { label: "Research", items: ["People", "Watchlist", "Lists", "History"] },
      { label: "Utilities", items: ["Inbox", "Settings"] },
    ]);
  });

  it("keeps gated future destinations in the manifest without exposing them", () => {
    const registered = navigation.NAVIGATION_MANIFEST.flatMap((group) => group.items);
    const visible = navigation.getVisibleNavigationGroups().flatMap((group) => group.items);

    expect(registered.map((item) => item.href)).toContain("/assistant");
    expect(registered.map((item) => item.href)).toContain("/bulk");
    expect(registered.map((item) => item.href)).toContain("/autopilot");
    expect(visible.map((item) => item.href)).not.toContain("/assistant");
    expect(visible.map((item) => item.href)).not.toContain("/bulk");
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
      "/inbox",
      "/settings",
      "/settings/business-profile",
      "/billing",
    ]);
    expect(navigation.filterNavItems("billing").map((item) => item.href)).toEqual([
      "/billing",
    ]);
    expect(navigation.filterNavItems("business profile").map((item) => item.href)).toEqual([
      "/settings/business-profile",
    ]);
    expect(navigation.filterNavItems("memory")).toEqual([]);
  });

  it("derives Settings cards, palette records, and breadcrumbs from manifest children", () => {
    const settings = navigation.NAVIGATION_MANIFEST
      .flatMap((group) => group.items)
      .find((item) => item.id === "settings");
    expect(settings?.children?.map((item) => item.id)).toEqual([
      "business-profile",
      "billing",
      "api-keys",
    ]);

    const visibleSettings = navigation.getVisibleSettingsDestinations();
    expect(visibleSettings.map((item) => item.id)).toEqual(["business-profile", "billing"]);
    expect(visibleSettings.every((item) => settings?.children?.includes(item))).toBe(true);

    const businessProfile = settings?.children?.[0];
    expect(businessProfile).toBeDefined();
    if (!businessProfile) return;
    const crumb = navigation.getNavigationBreadcrumb(businessProfile.href);
    expect(crumb).toMatchObject({ parent: "Settings", current: businessProfile.label });

    const changedManifest = navigation.NAVIGATION_MANIFEST.map((group) => ({
      ...group,
      items: group.items.map((item) => item.id === "settings"
        ? {
            ...item,
            children: item.children?.map((child) => child.id === "billing"
              ? { ...child, label: "Invoices", href: "/settings/invoices", keywords: "child-only-ledger-token" }
              : child),
          }
        : item),
    }));
    expect(navigation.getSearchNavigationItems(changedManifest).find((item) => item.id === "billing"))
      .toMatchObject({
        label: "Invoices",
        href: "/settings/invoices",
        keywords: "child-only-ledger-token",
      });
  });

  it("matches exact, descendant, and settings-owned active routes", () => {
    expect(navigation.isNavigationItemActive({ href: "/dashboard" }, "/dashboard")).toBe(true);
    expect(navigation.isNavigationItemActive({ href: "/dashboard" }, "/dashboard/summary")).toBe(false);
    expect(navigation.isNavigationItemActive({ href: "/lists" }, "/lists/abc")).toBe(true);
    const settings = navigation.NAVIGATION_MANIFEST
      .flatMap((group) => group.items)
      .find((item) => item.id === "settings");
    expect(settings).toBeDefined();
    if (!settings) return;
    expect(navigation.isNavigationItemActive(settings, "/settings/business-profile")).toBe(true);
    expect(navigation.isNavigationItemActive(settings, "/billing")).toBe(true);
  });
});
