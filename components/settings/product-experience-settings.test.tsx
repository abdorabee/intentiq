// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductExperienceSettings } from "./product-experience-settings";

const ACTIVE = { tour_version: 3, tour_status: "completed" as const, tour_step: 4 };

afterEach(cleanup);

describe("ProductExperienceSettings", () => {
  it("restarts an active tour, preserves its version, and persists step zero", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ preferences: {} })));
    const user = userEvent.setup();
    render(<ProductExperienceSettings initial={ACTIVE} fetcher={fetcher as typeof fetch} />);
    await user.click(screen.getByRole("button", { name: "Restart guided tour" }));
    expect(await screen.findByRole("status")).toHaveTextContent("ready to restart");
    expect(screen.getByText("not started")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ tour_version: 3, tour_status: "not_started", tour_step: 0 });
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
