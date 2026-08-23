"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";

import {
  nextExplicitTheme,
  parseStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
} from "@/lib/theme";
import type { ThemePreference } from "@/lib/user-preferences";

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => Promise<"ok" | "skipped" | "error">;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "dark",
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: async () => "skipped",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

let listeners: Array<() => void> = [];
function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPreference(): ThemePreference {
  return parseStoredThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
}

function getSnapshot(): ThemePreference {
  return readPreference();
}

function getServerSnapshot(): ThemePreference {
  return "dark";
}

function writePreference(preference: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  emitChange();
}

async function persistPreferenceRemote(
  preference: ThemePreference
): Promise<"ok" | "skipped" | "error"> {
  try {
    const response = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: preference }),
    });
    if (response.status === 401) return "skipped";
    if (!response.ok) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => resolveTheme(readPreference(), systemPrefersDark()),
    () => "dark" as ResolvedTheme
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => emitChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetch("/api/user/preferences")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { preferences?: { theme?: ThemePreference } } | null) => {
        if (cancelled || !data?.preferences?.theme) return;
        if (data.preferences.theme === readPreference()) return;
        writePreference(data.preferences.theme);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const setTheme = useCallback(async (next: ThemePreference) => {
    const previous = readPreference();
    writePreference(next);
    const result = await persistPreferenceRemote(next);
    if (result === "error") {
      writePreference(previous);
    }
    return result;
  }, []);

  const toggleTheme = useCallback(() => {
    void setTheme(nextExplicitTheme(resolvedTheme));
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        preference,
        theme: resolvedTheme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
