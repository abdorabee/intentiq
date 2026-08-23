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
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: mobile,
      media: "(max-width: 980px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
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
});

describe("authenticated navigation shell", () => {
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
