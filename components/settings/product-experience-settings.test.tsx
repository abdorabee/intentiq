// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductExperienceSettings } from "./product-experience-settings";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

const ACTIVE = { tour_version: 3, tour_status: "completed" as const, tour_step: 4 };
const PREFERENCES = {
  theme: "system",
  sidebar_collapsed: false,
  analytics_enabled: false,
  onboarding_version: 0,
  onboarding_revision: 0,
  onboarding_step: 0,
  onboarding_draft: {},
  tour_version: 3,
  tour_status: "not_started",
  tour_step: 0,
  tour_updated_at: "2026-08-23T12:00:00.000Z",
  updated_at: "2026-08-23T12:00:00.000Z",
};

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
});

describe("ProductExperienceSettings", () => {
  it("restarts an active tour without sending a client-owned version", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ tour: {
      tour_version: 3,
      tour_status: "in_progress",
      tour_step: 0,
      tour_updated_at: PREFERENCES.tour_updated_at,
    } })));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("status")).toHaveTextContent("restarting on Dashboard");
    expect(screen.getByText("in progress")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      action: "restart",
      expected: { version: 3, status: "completed", step: 4 },
    });
    expect(navigation.push).toHaveBeenCalledWith("/dashboard");
  });

  it("reconciles an authoritative concurrent tour version from the server", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "Tour progress changed", tour: {
      tour_version: 4,
      tour_status: "in_progress",
      tour_step: 2,
      tour_updated_at: PREFERENCES.tour_updated_at,
    } }), { status: 409 }));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("changed on another device");
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("does not expose a restart control before a real tour version exists", () => {
    render(<ProductExperienceSettings initial={{ tour_version: 0, tour_status: "not_started", tour_step: 0 }} />);
    expect(screen.queryByRole("button", { name: "Restart guided tour" })).not.toBeInTheDocument();
  });

  it("rolls back optimistic state and exposes a retryable error", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "offline" }), { status: 503 }));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be restarted");
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
