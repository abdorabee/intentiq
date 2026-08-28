import { describe, expect, it } from "vitest";

import {
  isSettingsNavActive,
  SETTINGS_NAV_ITEMS,
  settingsNavValue,
} from "./settings-nav";

describe("settings navigation", () => {
  it("lists Account first and keeps Billing as a settings path", () => {
    expect(SETTINGS_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Account",
      "Selling profile",
      "Appearance",
      "Experience",
      "Billing",
    ]);
    expect(SETTINGS_NAV_ITEMS[0]).toMatchObject({ href: "/settings", id: "account" });
    expect(SETTINGS_NAV_ITEMS.find((item) => item.id === "billing")?.href).toBe(
      "/settings/billing"
    );
  });

  it("treats /settings and /settings/account as Account", () => {
    expect(settingsNavValue("/settings")).toBe("/settings");
    expect(settingsNavValue("/settings/account")).toBe("/settings");
    expect(isSettingsNavActive("/settings", "/settings")).toBe(true);
    expect(isSettingsNavActive("/settings/account", "/settings")).toBe(true);
    expect(isSettingsNavActive("/settings/selling", "/settings")).toBe(false);
  });

  it("activates nested section paths without stealing Account", () => {
    expect(isSettingsNavActive("/settings/selling", "/settings/selling")).toBe(true);
    expect(isSettingsNavActive("/settings/appearance", "/settings/appearance")).toBe(true);
    expect(isSettingsNavActive("/settings/experience", "/settings/experience")).toBe(true);
    expect(isSettingsNavActive("/settings/billing", "/settings/billing")).toBe(true);
  });
});
