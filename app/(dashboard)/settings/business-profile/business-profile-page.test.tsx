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
  it("preserves custom profile values and protects unsaved edits", async () => {
    const user = userEvent.setup();
    render(<BusinessProfilePage />);
    await screen.findByText("Your ICP Profile");

    await user.type(screen.getByLabelText("Custom Target Industries"), "Energy");
    await user.click(screen.getByRole("button", { name: "Add custom Target Industries" }));
    expect(screen.getByRole("button", { name: /Energy/ })).toHaveAttribute("aria-pressed", "true");

    const event = new Event("beforeunload", { cancelable: true });
    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(true);

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const link = document.createElement("a");
    link.href = "/settings/appearance";
    document.body.append(link);
    const navigation = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(navigation);
    expect(confirm).toHaveBeenCalledWith("Discard your unsaved business profile changes?");
    expect(navigation.defaultPrevented).toBe(true);
  });

  it("offers a retry when the profile cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "offline" }), { status: 503 })));
    render(<BusinessProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not load");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
