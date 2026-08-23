import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LegacyProfileRoute from "../memory/page";
import SettingsPage from "./page";

function captureRedirect(render: () => unknown): string | null {
  try {
    render();
    return null;
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      return String(error.digest);
    }
    return null;
  }
}

describe("settings route compatibility", () => {
  it("permanently redirects the legacy profile route to Business profile", () => {
    const digest = captureRedirect(() => LegacyProfileRoute());

    expect(digest).toContain("/settings/business-profile");
    expect(digest).toContain("308");
  });

  it("renders Settings as a real destination", () => {
    const html = renderToStaticMarkup(createElement(SettingsPage));

    expect(html).toContain("Settings");
    expect(html).toContain("Business profile");
    expect(html).toContain("Account &amp; security");
    expect(html).toContain("Appearance");
    expect(html).toContain("Developer");
    expect(html).toContain("Data &amp; privacy");
    expect(html).toContain("Billing");
    expect(html).not.toContain("Memory");
  });

  it("registers the relocated Business profile route", () => {
    expect(existsSync(new URL("./business-profile/page.tsx", import.meta.url))).toBe(true);
  });

  it.each([
    "./account/page.tsx",
    "./appearance/page.tsx",
    "./developer/page.tsx",
    "./data-privacy/page.tsx",
    "./product-experience/page.tsx",
    "./layout.tsx",
    "./loading.tsx",
    "./error.tsx",
  ])("registers the Settings product seam at %s", (path) => {
    expect(existsSync(new URL(path, import.meta.url))).toBe(true);
  });
});
