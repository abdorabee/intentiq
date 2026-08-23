import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhook } from "standardwebhooks";

vi.mock("server-only", () => ({}));

const harness = vi.hoisted(() => ({
  calls: [] as Array<{ name: string; args: Record<string, unknown> }>,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      harness.calls.push({ name, args });
      return { data: "processed", error: null };
    },
  }),
}));

import { POST } from "./route";

const signingSecret = `whsec_${Buffer.from("vesperwise-local-clerk-webhook-test-key").toString("base64")}`;

function signedRequest(payload: string, eventId = "evt_signed_update") {
  const timestamp = new Date();
  const signature = new Webhook(signingSecret).sign(eventId, timestamp, payload);
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": eventId,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": signature,
    },
    body: payload,
  });
}

beforeEach(() => {
  harness.calls = [];
  vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", signingSecret);
  vi.stubEnv("CLERK_LIFECYCLE_PROBE_USER_ID", "user_probe");
  vi.stubEnv("CLERK_USER_LIFECYCLE_CONTRACT", "vesperwise-clerk-lifecycle-v1");
});

describe("Clerk raw webhook signature integration", () => {
  it("accepts a real Svix-compatible signature over the exact raw body", async () => {
    const payload = JSON.stringify({
      type: "user.updated",
      data: {
        id: "user_probe",
        primary_email_address_id: "email_primary",
        email_addresses: [{ id: "email_primary", email_address: "probe@example.com" }],
      },
    });
    const response = await POST(signedRequest(payload) as never);
    expect(response.status).toBe(200);
    expect(harness.calls).toHaveLength(1);
  });

  it("rejects a body changed after it was signed", async () => {
    const original = JSON.stringify({ type: "user.deleted", data: { id: "user_probe" } });
    const request = signedRequest(original);
    const tampered = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ type: "user.deleted", data: { id: "user_foreign" } }),
    });
    const response = await POST(tampered as never);
    expect(response.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });
});
