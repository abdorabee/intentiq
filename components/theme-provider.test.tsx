// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeControl() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <>
      <output aria-label="Theme state">{theme}:{resolvedTheme}</output>
      <button type="button" onClick={() => setTheme("light")}>Light</button>
      <button type="button" onClick={() => setTheme("dark")}>Dark</button>
      <button type="button" onClick={() => setTheme("system")}>System</button>
    </>
  );
}

function deferredPreferenceFetch() {
  const requests: Array<{
    body: Record<string, unknown>;
    settle: (response: Response) => void;
  }> = [];
  const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => (
    new Promise<Response>((resolve) => {
      requests.push({
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        settle: resolve,
      });
    })
  ));
  vi.stubGlobal("fetch", fetcher);
  return { fetcher, requests };
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

    expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("system:light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("updates optimistically and rolls back the local mirror when persistence fails", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    const { requests } = deferredPreferenceFetch();
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("light:light");
    expect(localStorage.getItem("intentiq-theme")).toBe("light");

    requests[0].settle(new Response(JSON.stringify({ error: "nope" }), { status: 500 }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("dark:dark"));
    expect(localStorage.getItem("intentiq-theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("serializes overlapping successful writes so the server receives the latest theme last", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    const { fetcher, requests } = deferredPreferenceFetch();
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Light" }));
    await user.click(screen.getByRole("button", { name: "System" }));

    expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("system:light");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(requests[0].body).toEqual({ theme: "light" });

    requests[0].settle(new Response("{}", { status: 200 }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(requests[1].body).toEqual({ theme: "system" });
    requests[1].settle(new Response("{}", { status: 200 }));
    await waitFor(() => expect(localStorage.getItem("intentiq-theme")).toBe("system"));
  });

  it("does not roll an older failed theme write over a newer choice", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    const { fetcher, requests } = deferredPreferenceFetch();
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Light" }));
    await user.click(screen.getByRole("button", { name: "System" }));
    requests[0].settle(new Response("{}", { status: 500 }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("system:light");
    expect(requests[1].body).toEqual({ theme: "system" });
    requests[1].settle(new Response("{}", { status: 200 }));
    await waitFor(() => expect(localStorage.getItem("intentiq-theme")).toBe("system"));
  });

  it("rolls the latest failed overlapping theme write back to the last server-confirmed value", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    const { fetcher, requests } = deferredPreferenceFetch();
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Light" }));
    await user.click(screen.getByRole("button", { name: "System" }));
    requests[0].settle(new Response("{}", { status: 200 }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    requests[1].settle(new Response("{}", { status: 500 }));

    await waitFor(() => expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent("light:light"));
    expect(localStorage.getItem("intentiq-theme")).toBe("light");
  });
});
