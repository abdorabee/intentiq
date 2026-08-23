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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

  it("resets copied feedback whenever a second secret is created", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ keys: [], limit: 2, plan: "starter" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        key: "vesperwise_first-secret",
        record: { id: "key_1", label: "First", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" },
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        key: "vesperwise_second-secret",
        record: { id: "key_2", label: "Second", last_used: null, is_active: true, created_at: "2026-08-23T12:01:00.000Z" },
      }), { status: 201 }));
    render(<ApiKeysManager />);
    await screen.findByText("0 of 2 active keys");
    await user.type(screen.getByLabelText("Key label"), "First");
    await user.click(screen.getByRole("button", { name: "Create API key" }));
    await user.click(await screen.findByRole("button", { name: "Copy key" }));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "I saved this key" }));
    await user.type(screen.getByLabelText("Key label"), "Second");
    await user.click(screen.getByRole("button", { name: "Create API key" }));
    expect(await screen.findByText("vesperwise_second-secret")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy key" })).toBeInTheDocument();
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

    const revokeButton = screen.getByRole("button", { name: "Revoke Production" });
    revokeButton.focus();
    await user.click(revokeButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { name: "Revoke API key" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm revoke" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Revoke API key" })).not.toBeInTheDocument();
    expect(revokeButton).toHaveFocus();

    await user.click(revokeButton);

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ record: { id: "key_1", is_active: false } })));
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][0])).toContain("id=key_1");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Revoke API key" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "API keys" })).toHaveFocus();
  });

  it("keeps focus inside the dialog on a focusable status while revocation is pending", async () => {
    let resolveRevoke: ((response: Response) => void) | undefined;
    const pendingRevoke = new Promise<Response>((resolve) => { resolveRevoke = resolve; });
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        keys: [{ id: "key_1", label: "Production", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" }],
        limit: 2,
        plan: "starter",
      })))
      .mockImplementationOnce(() => pendingRevoke);
    render(<ApiKeysManager />);
    await screen.findByText("Production");
    await user.click(screen.getByRole("button", { name: "Revoke Production" }));
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    const status = await screen.findByRole("status", { name: "Revocation in progress" });
    expect(status).toHaveFocus();
    await user.tab();
    expect(status).toHaveFocus();
    resolveRevoke?.(new Response(JSON.stringify({ record: { id: "key_1", is_active: false } })));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Revoke API key" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "API keys" })).toHaveFocus();
  });

  it("restores safe in-dialog focus and supports cancellation after revoke failure", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        keys: [{ id: "key_1", label: "Production", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" }],
        limit: 2,
        plan: "starter",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503 }));
    render(<ApiKeysManager />);
    await screen.findByText("Production");
    const revokeButton = screen.getByRole("button", { name: "Revoke Production" });
    await user.click(revokeButton);
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Revoke API key" })).not.toBeInTheDocument();
    expect(revokeButton).toHaveFocus();
  });

  it("supports retrying a revoke after focus recovers from failure", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        keys: [{ id: "key_1", label: "Production", last_used: null, is_active: true, created_at: "2026-08-23T12:00:00.000Z" }],
        limit: 2,
        plan: "starter",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Try again" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ record: { id: "key_1", is_active: false } })));
    render(<ApiKeysManager />);
    await screen.findByText("Production");
    await user.click(screen.getByRole("button", { name: "Revoke Production" }));
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Revoke API key" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "API keys" })).toHaveFocus();
  });
});
