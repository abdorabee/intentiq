// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardShell from "./dashboard-shell";
import { SearchProvider } from "./search-provider";
import DashboardTopbar from "./dashboard-topbar";
import DashboardNav from "./nav";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      fullName: "Ada Lovelace",
      firstName: "Ada",
      lastName: "Lovelace",
      primaryEmailAddress: { emailAddress: "ada@example.com" },
    },
  }),
  SignOutButton: ({ children }: { children: ReactNode }) => children,
}));

function setViewport(mobile: boolean) {
  let matches = mobile;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() { return matches; },
    media: "(max-width: 980px)",
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => mediaQuery),
  });
  return {
    setMatches(next: boolean) {
      matches = next;
      const event = { matches: next, media: mediaQuery.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
    mediaQuery,
  };
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  localStorage.clear();
  navigation.push.mockReset();
});

beforeEach(() => {
  navigation.pathname = "/dashboard";
  setViewport(false);
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
});

describe("authenticated navigation shell", () => {
  it("uses the server sidebar preference on the first render", () => {
    const { container } = render(
      <DashboardShell creditsRemaining={80} plan="starter" initialSidebarCollapsed>
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    expect(container.querySelector(".dashboard-shell")).toHaveClass("is-collapsed");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(localStorage.getItem("nav-collapsed")).toBe("true");
  });

  it("rolls an optimistic sidebar update back when server persistence fails", async () => {
    let settle!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { settle = resolve; })));
    const user = userEvent.setup();
    const { container } = render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(container.querySelector(".dashboard-shell")).toHaveClass("is-collapsed");
    settle(new Response("{}", { status: 500 }));
    await waitFor(() => expect(container.querySelector(".dashboard-shell")).not.toHaveClass("is-collapsed"));
    expect(localStorage.getItem("nav-collapsed")).toBe("false");
    expect(document.documentElement).toHaveAttribute("data-dashboard-sidebar", "expanded");
  });

  it("contains mobile focus, closes on Escape, restores focus, and unlocks scrolling", async () => {
    setViewport(true);
    const user = userEvent.setup();
    render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(menuButton);

    const dialog = await screen.findByRole("dialog", { name: "Workspace navigation" });
    const closeButton = within(dialog).getByRole("button", { name: "Close navigation menu" });
    expect(closeButton).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.tab({ shift: true });
    expect(within(dialog).getByRole("button", { name: "Sign out" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Workspace navigation" })).not.toBeInTheDocument());
    expect(menuButton).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("does not expose the desktop collapse preference inside the mobile drawer", async () => {
    setViewport(true);
    const user = userEvent.setup();
    render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const dialog = await screen.findByRole("dialog", { name: "Workspace navigation" });
    expect(within(dialog).queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
  });

  it("hands modal ownership from the mobile drawer to search and restores the menu trigger", async () => {
    setViewport(true);
    const user = userEvent.setup();
    render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(menuButton);
    const drawer = await screen.findByRole("dialog", { name: "Workspace navigation" });
    await user.click(within(drawer).getByRole("button", { name: "Search" }));

    const searchDialog = await screen.findByRole("dialog", { name: "Search" });
    expect(screen.getAllByRole("dialog")).toEqual([searchDialog]);
    expect(screen.queryByRole("dialog", { name: "Workspace navigation" })).not.toBeInTheDocument();
    const searchInput = screen.getByRole("combobox", { name: "Search companies, people, and pages" });
    await waitFor(() => expect(searchInput).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("hands modal ownership from the mobile drawer to the global search shortcut", async () => {
    setViewport(true);
    const user = userEvent.setup();
    render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(menuButton);
    expect(await screen.findByRole("dialog", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.keyboard("{Control>}k{/Control}");

    const searchDialog = await screen.findByRole("dialog", { name: "Search" });
    expect(screen.getAllByRole("dialog")).toEqual([searchDialog]);
    expect(screen.queryByRole("dialog", { name: "Workspace navigation" })).not.toBeInTheDocument();
    const searchInput = screen.getByRole("combobox", { name: "Search companies, people, and pages" });
    await waitFor(() => expect(searchInput).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("cleans up the mobile dialog across breakpoint changes while preserving desktop collapse", async () => {
    const viewport = setViewport(false);
    const user = userEvent.setup();
    const { container } = render(
      <DashboardShell creditsRemaining={80} plan="starter">
        <p>Dashboard content</p>
      </DashboardShell>,
    );
    const shell = container.querySelector(".dashboard-shell");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(shell).toHaveClass("is-collapsed");

    viewport.setMatches(true);
    await waitFor(() => expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument());
    expect(shell).not.toHaveClass("is-collapsed");
    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(await screen.findByRole("dialog", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    viewport.setMatches(false);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Workspace navigation" })).not.toBeInTheDocument());
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(shell).toHaveClass("is-collapsed");
  });

  it("keeps account, settings, theme, and sign-out available with tooltips when collapsed", async () => {
    localStorage.setItem("nav-collapsed", "true");
    render(
      <SearchProvider>
        <DashboardNav creditsRemaining={80} plan="starter" collapsed />
      </SearchProvider>,
    );

    const account = screen.getByRole("link", { name: "Account settings" });
    const settings = screen.getByRole("link", { name: "Settings" });
    const theme = screen.getByRole("button", { name: "Switch to light theme" });
    const signOut = screen.getByRole("button", { name: "Sign out" });
    expect(account).toHaveAttribute("href", "/settings");
    expect(settings).toHaveAttribute("href", "/settings");
    expect(theme).toBeVisible();
    expect(signOut).toBeVisible();

    for (const [control, label] of [[account, "Account"], [settings, "Settings"], [theme, "Theme"], [signOut, "Sign out"]] as const) {
      control.focus();
      expect(await screen.findByRole("tooltip", { name: label })).toBeVisible();
      control.blur();
    }
  });

  it("describes the credit progress value as remaining credits", () => {
    render(
      <SearchProvider>
        <DashboardNav creditsRemaining={80} plan="starter" />
      </SearchProvider>,
    );

    expect(screen.getByRole("progressbar", { name: "Monthly credits remaining" })).toBeInTheDocument();
  });

  it("uses semantic breadcrumbs and omits empty global score bands", () => {
    navigation.pathname = "/inbox";
    render(
      <SearchProvider>
        <DashboardTopbar bandCounts={{ hot: 0, warm: 0, cold: 0 }} />
      </SearchProvider>,
    );

    const breadcrumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbs).getByText("Inbox")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("HOT 0")).not.toBeInTheDocument();
    expect(screen.queryByText("WARM 0")).not.toBeInTheDocument();
    expect(screen.queryByText("COLD 0")).not.toBeInTheDocument();
  });

  it("does not present the unimplemented billing export as an actionable control", () => {
    navigation.pathname = "/billing";
    render(
      <SearchProvider>
        <DashboardTopbar />
      </SearchProvider>,
    );

    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });
});
