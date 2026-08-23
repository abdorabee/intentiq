import { describe, expect, it } from "vitest";

import {
  nextExplicitTheme,
  parseStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme resolution", () => {
  it("uses the intentiq-theme localStorage key", () => {
    expect(THEME_STORAGE_KEY).toBe("intentiq-theme");
  });

  it("treats missing or unknown stored values as dark", () => {
    expect(parseStoredThemePreference(null)).toBe("dark");
    expect(parseStoredThemePreference("")).toBe("dark");
    expect(parseStoredThemePreference("sepia")).toBe("dark");
  });

  it("reads light, dark, and system from the cache", () => {
    expect(parseStoredThemePreference("light")).toBe("light");
    expect(parseStoredThemePreference("dark")).toBe("dark");
    expect(parseStoredThemePreference("system")).toBe("system");
  });

  it("resolves system from the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("toggles the resolved appearance to an explicit opposite theme", () => {
    expect(nextExplicitTheme("dark")).toBe("light");
    expect(nextExplicitTheme("light")).toBe("dark");
  });
});
