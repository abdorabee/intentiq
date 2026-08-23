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
});

describe("root boot preferences", () => {
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
