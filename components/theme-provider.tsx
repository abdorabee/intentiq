"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  createPreferenceWriteCoordinator,
  patchUserPreferences,
  THEME_STORAGE_KEY,
  themePreferenceSchema,
  type ThemePreference,
} from "@/lib/user-preferences";

type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  reconcileTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  reconcileTheme: () => {},
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
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  colorScheme.addEventListener("change", listener);
  return () => {
    listeners = listeners.filter((candidate) => candidate !== listener);
    colorScheme.removeEventListener("change", listener);
  };
}

function storedTheme(): ThemePreference {
  const parsed = themePreferenceSchema.safeParse(localStorage.getItem(THEME_STORAGE_KEY));
  return parsed.success ? parsed.data : "dark";
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSnapshot(): `${ThemePreference}:${ResolvedTheme}` {
  const theme = storedTheme();
  return `${theme}:${resolveTheme(theme)}`;
}

function getServerSnapshot(): `${ThemePreference}:${ResolvedTheme}` {
  return "dark:dark";
}

function applyTheme(theme: ThemePreference) {
  const resolved = resolveTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  emitChange();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, resolvedTheme] = snapshot.split(":") as [ThemePreference, ResolvedTheme];
  const [writer] = useState(() => (
    createPreferenceWriteCoordinator<ThemePreference>({
      initialValue: "dark",
      persist: (value) => patchUserPreferences({ theme: value }),
      rollback: applyTheme,
    })
  ));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    writer.reconcile(storedTheme());
  }, [writer]);

  const setTheme = useCallback((next: ThemePreference) => {
    const previous = storedTheme();
    if (previous === next) return;

    applyTheme(next);
    writer.request(next);
  }, [writer]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const reconcileTheme = useCallback((serverTheme: ThemePreference) => {
    writer.reconcile(serverTheme);
    if (storedTheme() !== serverTheme) applyTheme(serverTheme);
  }, [writer]);

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      reconcileTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
