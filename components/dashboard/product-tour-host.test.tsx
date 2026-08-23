// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductTourHost } from "./product-tour-host";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));

const DORMANT = {
  tour_version: 0,
  tour_status: "not_started" as const,
  tour_step: 0,
  tour_updated_at: null,
};

const ACTIVE = {
  tour_version: 1,
  tour_status: "in_progress" as const,
  tour_step: 0,
  tour_updated_at: "2026-08-24T01:00:00.000Z",
};

beforeEach(() => {
  navigation.pathname = "/dashboard";
  navigation.push.mockReset();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("ResizeObserver", class ResizeObserverMock {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProductTourHost", () => {
  it("does not auto-start, navigate, or write while the checked-in active version is zero", () => {
    const fetcher = vi.fn();
    render(
      <>
        <div data-tour="dashboard-overview">Overview</div>
        <ProductTourHost initial={DORMANT} fetcher={fetcher as typeof fetch} />
      </>,
    );
    expect(screen.queryByRole("dialog", { name: /product tour/i })).not.toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("fails closed instead of auto-starting from malformed persisted progress", () => {
    const fetcher = vi.fn();
    render(<ProductTourHost initial={{ ...DORMANT, tour_step: 99 } as typeof DORMANT} activeVersion={1} fetcher={fetcher as typeof fetch} />);
    expect(screen.queryByRole("dialog", { name: /product tour/i })).not.toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("resumes a persisted step, marks its target, and supports keyboard navigation", async () => {
    const authoritative = { ...ACTIVE, tour_step: 1 };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ tour: authoritative })));
    const user = userEvent.setup();
    render(
      <>
        <button data-tour="dashboard-overview">Overview</button>
        <ProductTourHost initial={ACTIVE} activeVersion={1} fetcher={fetcher as typeof fetch} />
      </>,
    );

    const dialog = await screen.findByRole("dialog", { name: "Product tour: Workspace overview" });
    expect(document.querySelector('[data-tour="dashboard-overview"]')).toHaveAttribute("data-tour-active", "true");
    expect(screen.getByText("1 of 5")).toBeInTheDocument();
    expect(dialog.querySelector("[data-tour-initial-focus]")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      action: "next",
      expected: { version: 1, status: "in_progress", step: 0 },
    });
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/score"));
  });

  it("persists Skip and returns to Dashboard instead of treating local state as authority", async () => {
    navigation.pathname = "/score";
    const initial = { ...ACTIVE, tour_step: 1 };
    const dismissed = { ...initial, tour_status: "dismissed" as const };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ tour: dismissed })));
    const user = userEvent.setup();
    render(
      <>
        <button data-tour="score-domain">Domain</button>
        <ProductTourHost initial={initial} activeVersion={1} fetcher={fetcher as typeof fetch} />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: "Skip tour" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("dialog", { name: /product tour/i })).not.toBeInTheDocument();
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      action: "skip",
      expected: { version: 1, status: "in_progress", step: 1 },
    });
  });

  it("rolls back and announces persistence failures", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "offline" }), { status: 503 }));
    const user = userEvent.setup();
    render(
      <>
        <button data-tour="dashboard-overview">Overview</button>
        <ProductTourHost initial={ACTIVE} activeVersion={1} fetcher={fetcher as typeof fetch} />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: "Next" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(screen.getByText("1 of 5")).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("hydrates authoritative progress from a conflict instead of retrying stale state", async () => {
    const authoritative = { ...ACTIVE, tour_step: 2, tour_updated_at: "2026-08-24T01:02:00.000Z" };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "Tour progress changed", tour: authoritative }), { status: 409 }));
    const user = userEvent.setup();
    render(
      <>
        <button data-tour="dashboard-overview">Overview</button>
        <ProductTourHost initial={ACTIVE} activeVersion={1} fetcher={fetcher as typeof fetch} />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/pipeline"));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("starts an upgraded version from the authoritative endpoint and routes to its first target", async () => {
    const upgraded = { ...ACTIVE, tour_version: 2 };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ tour: upgraded })));
    render(
      <>
        <div data-tour="dashboard-overview">Overview</div>
        <ProductTourHost initial={{ ...DORMANT, tour_version: 1, tour_status: "completed" }} activeVersion={2} fetcher={fetcher as typeof fetch} />
      </>,
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      action: "start",
      expected: { version: 1, status: "completed", step: 0 },
    });
    expect(await screen.findByRole("dialog", { name: "Product tour: Workspace overview" })).toBeInTheDocument();
  });

  it("opens mobile navigation before targeting Settings and closes it after Finish", async () => {
    const initial = { ...ACTIVE, tour_step: 4 };
    const completed = { ...initial, tour_status: "completed" as const };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ tour: completed })));
    const user = userEvent.setup();

    function MobileTour() {
      const [open, setOpen] = useState(false);
      return (
        <>
          {open && <a href="/settings" data-tour="navigation-settings">Settings</a>}
          <ProductTourHost
            initial={initial}
            activeVersion={1}
            fetcher={fetcher as typeof fetch}
            isMobile
            openMobileNavigation={() => setOpen(true)}
            closeMobileNavigation={() => setOpen(false)}
          />
        </>
      );
    }

    render(<MobileTour />);
    expect(await screen.findByRole("link", { name: "Settings" })).toHaveAttribute("data-tour-active", "true");
    const dialog = screen.getByRole("dialog", { name: "Product tour: Navigate and adjust Settings" });
    expect(dialog.querySelector("[data-tour-initial-focus]")).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Finish" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument());
    expect(navigation.push).toHaveBeenCalledWith("/dashboard");
  });
});
