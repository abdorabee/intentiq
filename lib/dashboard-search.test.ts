import { describe, expect, it } from "vitest";
import { SEARCH_NAV_ITEMS, filterNavItems } from "./dashboard-search";

describe("dashboard search registry", () => {
  it("replaces Memory/Profile with Settings", () => {
    expect(SEARCH_NAV_ITEMS.some((item) => item.href === "/memory")).toBe(false);
    expect(SEARCH_NAV_ITEMS.some((item) => item.label === "Profile")).toBe(false);
    expect(SEARCH_NAV_ITEMS.some((item) => item.id === "memory")).toBe(false);

    const settings = SEARCH_NAV_ITEMS.find((item) => item.id === "settings");
    expect(settings).toMatchObject({
      label: "Settings",
      href: "/settings",
    });
  });

  it("finds Settings via profile, ICP, selling, appearance, and account keywords", () => {
    for (const query of ["profile", "icp", "selling", "appearance", "account", "experience", "theme"]) {
      const matches = filterNavItems(query);
      expect(matches.some((item) => item.href === "/settings")).toBe(true);
    }
  });
});
