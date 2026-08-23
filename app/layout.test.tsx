// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
  JetBrains_Mono: () => ({ variable: "font-mono" }),
}));

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/google-analytics", () => ({ GoogleAnalytics: () => null }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.dashboardSidebar;
  document.documentElement.classList.remove("dark");
});

describe("root boot preferences", () => {
  function executeBoot(theme: string | null, systemDark: boolean) {
    localStorage.clear();
    if (theme !== null) localStorage.setItem("intentiq-theme", theme);
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: systemDark }),
    });
    const markup = renderToStaticMarkup(<RootLayout><main>Content</main></RootLayout>);
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const bootScript = parsed.querySelector("head script")?.textContent;

    Function("localStorage", "document", "matchMedia", bootScript ?? "")(
      localStorage,
      document,
      window.matchMedia,
    );
    return document.documentElement.classList.contains("dark");
  }

  it.each([
    { systemDark: false, expected: false },
    { systemDark: true, expected: true },
  ])("treats a missing theme mirror as System when OS dark is $systemDark", ({ systemDark, expected }) => {
    expect(executeBoot(null, systemDark)).toBe(expected);
  });

  it.each([
    { theme: "light", systemDark: true, expected: false },
    { theme: "dark", systemDark: false, expected: true },
    { theme: "invalid", systemDark: false, expected: false },
    { theme: "invalid", systemDark: true, expected: true },
  ])("honors '$theme' against OS dark $systemDark", ({ theme, systemDark, expected }) => {
    expect(executeBoot(theme, systemDark)).toBe(expected);
  });

  it("resolves a persisted System theme from the OS before React renders", () => {
    localStorage.setItem("intentiq-theme", "system");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    document.documentElement.classList.add("dark");
    const markup = renderToStaticMarkup(<RootLayout><main>Content</main></RootLayout>);
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const bootScript = parsed.querySelector("head script")?.textContent;

    Function("localStorage", "document", "matchMedia", bootScript ?? "")(
      localStorage,
      document,
      window.matchMedia,
    );

    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("marks a persisted collapsed dashboard sidebar before the app shell renders", () => {
    localStorage.setItem("nav-collapsed", "true");
    const markup = renderToStaticMarkup(<RootLayout><main>Content</main></RootLayout>);
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const bootScript = parsed.querySelector("head script")?.textContent;
    expect(bootScript).toBeTruthy();

    Function("localStorage", "document", bootScript ?? "")(localStorage, document);

    expect(document.documentElement).toHaveAttribute("data-dashboard-sidebar", "collapsed");
  });
});
