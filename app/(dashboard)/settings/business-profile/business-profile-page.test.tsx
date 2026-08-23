// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BusinessProfilePage from "./page";

const PROFILE = {
  product_category: "SaaS / Software",
  target_industries: ["Technology"],
  company_size: "Mid-Market (201-1000)",
  buyer_role: "VP / Director",
  sales_motion: "Outbound (cold outreach)",
  deal_size: "$25K - $100K",
  sales_cycle: "1-3 months",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ business_profile: PROFILE }))));
});

afterEach(cleanup);

describe("BusinessProfilePage", () => {
  it("protects typed custom values with an accessible dialog and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<BusinessProfilePage />);
    await screen.findByText("Your ICP Profile");

    await user.type(screen.getByLabelText("Custom Target Industries"), "Energy");

    const event = new Event("beforeunload", { cancelable: true });
    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(true);

    const link = document.createElement("a");
    link.href = "/settings/appearance";
    link.textContent = "Appearance settings";
    document.body.append(link);
    link.focus();
    await user.click(link);
    const dialog = screen.getByRole("dialog", { name: "Discard unsaved changes?" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stay on this page" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(dialog).not.toBeInTheDocument();
    expect(link).toHaveFocus();

    fireEvent.popState(window);
    expect(screen.getByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
  });

  it("offers a retry when the profile cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "offline" }), { status: 503 })));
    render(<BusinessProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not load");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("announces profile loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<BusinessProfilePage />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading business profile");
  });
});
