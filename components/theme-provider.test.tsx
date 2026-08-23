// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeControl() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme("light")}>
      {theme}:{resolvedTheme}
    </button>
  );
}

function setSystemDark(dark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: dark,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.add("dark");
  setSystemDark(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeProvider durable preferences", () => {
  it("resolves the persisted System preference before rendering consumers", () => {
    localStorage.setItem("intentiq-theme", "system");
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    expect(screen.getByRole("button")).toHaveTextContent("system:light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("updates optimistically and rolls back the local mirror when persistence fails", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    let settle!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { settle = resolve; })));
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("light:light");
    expect(localStorage.getItem("intentiq-theme")).toBe("light");

    settle(new Response(JSON.stringify({ error: "nope" }), { status: 500 }));
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("dark:dark"));
    expect(localStorage.getItem("intentiq-theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});
