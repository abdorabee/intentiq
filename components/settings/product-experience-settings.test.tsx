// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductExperienceSettings } from "./product-experience-settings";

const ACTIVE = { tour_version: 3, tour_status: "completed" as const, tour_step: 4 };
const PREFERENCES = {
  theme: "system",
  sidebar_collapsed: false,
  analytics_enabled: false,
  onboarding_version: 0,
  onboarding_step: 0,
  onboarding_draft: {},
  tour_version: 3,
  tour_status: "not_started",
  tour_step: 0,
  tour_updated_at: "2026-08-23T12:00:00.000Z",
  updated_at: "2026-08-23T12:00:00.000Z",
};

afterEach(cleanup);

describe("ProductExperienceSettings", () => {
  it("restarts an active tour without sending a client-owned version", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ preferences: PREFERENCES })));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("status")).toHaveTextContent("ready to restart");
    expect(screen.getByText("not started")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ tour_status: "not_started", tour_step: 0 });
  });

  it("reconciles an authoritative concurrent tour version from the server", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      preferences: { ...PREFERENCES, tour_version: 4 },
    })));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("status")).toHaveTextContent("ready to restart");
    expect(screen.getByText("4")).toBeInTheDocument();
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
