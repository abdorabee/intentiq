import {
  THEME_PREFERENCES,
  type ThemePreference,
} from "./user-preferences";

export const THEME_STORAGE_KEY = "intentiq-theme";
export type ResolvedTheme = "light" | "dark";

export function parseStoredThemePreference(
  stored: string | null | undefined
): ThemePreference {
  if (stored && THEME_PREFERENCES.includes(stored as ThemePreference)) {
    return stored as ThemePreference;
  }
  return "dark";
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

export function nextExplicitTheme(resolved: ResolvedTheme): ThemePreference {
  return resolved === "dark" ? "light" : "dark";
}
