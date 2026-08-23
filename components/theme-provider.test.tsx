// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useLayoutEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./theme-provider";

const hydratedRoots: Root[] = [];
const hydrationHosts: HTMLElement[] = [];

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

function ServerThemeHandoff({ initialTheme }: { initialTheme: "system" | "light" | "dark" }) {
  const { theme, resolvedTheme, reconcileTheme } = useTheme();
  useLayoutEffect(() => {
    reconcileTheme(initialTheme);
  }, [initialTheme, reconcileTheme]);
  return <output aria-label="Server theme state">{theme}:{resolvedTheme}</output>;
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
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  document.documentElement.classList.add("dark");
  setSystemDark(false);
});

afterEach(async () => {
  await act(async () => {
    for (const root of hydratedRoots.splice(0)) root.unmount();
  });
  for (const host of hydrationHosts.splice(0)) host.remove();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ThemeProvider durable preferences", () => {
  it.each([
    { mirror: null, systemDark: false, expected: "system:light", darkClass: false },
    { mirror: null, systemDark: true, expected: "system:dark", darkClass: true },
    { mirror: "invalid", systemDark: false, expected: "system:light", darkClass: false },
    { mirror: "invalid", systemDark: true, expected: "system:dark", darkClass: true },
  ])("hydrates a $mirror mirror without changing the System first paint on OS dark $systemDark", async ({
    mirror,
    systemDark,
    expected,
    darkClass,
  }) => {
    setSystemDark(systemDark);
    localStorage.clear();
    if (mirror !== null) localStorage.setItem("intentiq-theme", mirror);
    document.documentElement.classList.toggle("dark", darkClass);
    const classToggle = vi.spyOn(document.documentElement.classList, "toggle");
    const host = document.createElement("div");
    host.innerHTML = renderToString(<ThemeProvider><ThemeControl /></ThemeProvider>);
    document.body.append(host);
    hydrationHosts.push(host);

    await act(async () => {
      hydratedRoots.push(hydrateRoot(host, <ThemeProvider><ThemeControl /></ThemeProvider>));
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent(expected));
    expect(document.documentElement.classList.contains("dark")).toBe(darkClass);
    if (!darkClass) expect(classToggle).not.toHaveBeenCalledWith("dark", true);
  });

  it.each([
    { mirror: "light", systemDark: true, expected: "light:light", darkClass: false },
    { mirror: "dark", systemDark: false, expected: "dark:dark", darkClass: true },
  ])("preserves explicit $mirror through hydration on the opposite OS theme", async ({
    mirror,
    systemDark,
    expected,
    darkClass,
  }) => {
    setSystemDark(systemDark);
    localStorage.setItem("intentiq-theme", mirror);
    document.documentElement.classList.toggle("dark", darkClass);
    const host = document.createElement("div");
    host.innerHTML = renderToString(<ThemeProvider><ThemeControl /></ThemeProvider>);
    document.body.append(host);
    hydrationHosts.push(host);

    await act(async () => {
      hydratedRoots.push(hydrateRoot(host, <ThemeProvider><ThemeControl /></ThemeProvider>));
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole("status", { name: "Theme state" })).toHaveTextContent(expected));
    expect(document.documentElement.classList.contains("dark")).toBe(darkClass);
  });

  it("lets an authoritative server initial theme replace the local bootstrap mirror", async () => {
    localStorage.setItem("intentiq-theme", "dark");
    setSystemDark(true);
    render(
      <ThemeProvider>
        <ServerThemeHandoff initialTheme="light" />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByRole("status", { name: "Server theme state" })).toHaveTextContent("light:light"));
    expect(localStorage.getItem("intentiq-theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

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
