import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  event: null as null | { type: string; data: Record<string, unknown> },
  verifyError: null as Error | null,
  rpcResult: { data: "processed", error: null } as { data: unknown; error: unknown },
  rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
}));

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(async () => {
    if (harness.verifyError) throw harness.verifyError;
    return harness.event;
  }),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      harness.rpcCalls.push({ name, args });
      return harness.rpcResult;
    },
  }),
}));

import { POST } from "./route";

beforeEach(() => {
  harness.event = null;
  harness.verifyError = null;
  harness.rpcResult = { data: "processed", error: null };
  harness.rpcCalls = [];
});

describe("POST /api/webhooks/clerk", () => {
  it("rejects a request whose Clerk signature cannot be verified", async () => {
    harness.verifyError = new Error("bad signature");
    const response = await POST(new Request("http://localhost/api/webhooks/clerk", { method: "POST" }) as never);
    expect(response.status).toBe(400);
    expect(harness.rpcCalls).toEqual([]);
  });

  it("updates only the verified Clerk user and primary email through the idempotent RPC", async () => {
    harness.event = {
      type: "user.updated",
      data: {
        id: "user_owner",
        primary_email_address_id: "email_primary",
        email_addresses: [
          { id: "email_other", email_address: "other@example.com" },
          { id: "email_primary", email_address: "owner@example.com" },
        ],
      },
    };
    const request = new Request("http://localhost/api/webhooks/clerk", { method: "POST", headers: { "svix-id": "evt_update" } });
    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(harness.rpcCalls).toEqual([{
      name: "process_clerk_user_lifecycle_event",
      args: { p_event_id: "evt_update", p_event_type: "user.updated", p_user_id: "user_owner", p_email: "owner@example.com" },
    }]);
  });

  it("deletes only the verified Clerk user and reports database failures for retry", async () => {
    harness.event = { type: "user.deleted", data: { id: "user_deleted" } };
    harness.rpcResult = { data: null, error: { message: "db unavailable" } };
    const response = await POST(new Request("http://localhost/api/webhooks/clerk", { method: "POST", headers: { "svix-id": "evt_delete" } }) as never);
    expect(response.status).toBe(500);
    expect(harness.rpcCalls[0]?.args).toEqual({ p_event_id: "evt_delete", p_event_type: "user.deleted", p_user_id: "user_deleted", p_email: null });
  });

  it("ignores unrelated signed events and rejects malformed lifecycle events", async () => {
    harness.event = { type: "session.created", data: { id: "session_1" } };
    expect((await POST(new Request("http://localhost", { headers: { "svix-id": "evt_other" } }) as never)).status).toBe(204);
    harness.event = { type: "user.deleted", data: {} };
    expect((await POST(new Request("http://localhost", { headers: { "svix-id": "evt_bad" } }) as never)).status).toBe(400);
  });
});
