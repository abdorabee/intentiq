// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

import { ApiKeysManager } from "./api-keys-manager";

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(cleanup);

describe("ApiKeysManager", () => {
  it("shows a created secret once and lets the user explicitly dismiss it", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ keys: [], limit: 1, plan: "free" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        key: "vesperwise_secret-once",
        record: { id: "key_1", label: "Production", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" },
      }), { status: 201 }));
    render(<ApiKeysManager />);
    await screen.findByText("0 of 1 active keys");

    await user.type(screen.getByLabelText("Key label"), "Production");
    await user.click(screen.getByRole("button", { name: "Create API key" }));

    expect(await screen.findByText("vesperwise_secret-once")).toBeInTheDocument();
    expect(screen.getByText(/copy it now/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "I saved this key" }));
    expect(screen.queryByText("vesperwise_secret-once")).not.toBeInTheDocument();
  });

  it("requires explicit confirmation before revoking", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      keys: [{ id: "key_1", label: "Production", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" }],
      limit: 2,
      plan: "starter",
    })));
    render(<ApiKeysManager />);
    await screen.findByText("Production");

    await user.click(screen.getByRole("button", { name: "Revoke Production" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { name: "Revoke API key" })).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ record: { id: "key_1", is_active: false } })));
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][0])).toContain("id=key_1");
  });
});
