import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type ClerkUser = {
  id: string;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: Array<{ emailAddress: string }>;
};

type StoredUser = {
  id: string;
  email: string;
  plan?: string;
  credits_remaining?: number;
  onboarding_completed?: boolean;
};

const harness = vi.hoisted(() => ({
  clerkUser: {
    id: "user_owner",
    primaryEmailAddress: { emailAddress: "owner@example.com" },
    emailAddresses: [{ emailAddress: "owner@example.com" }],
  } as ClerkUser | null,
  clerkError: null as Error | null,
  upsertError: null as { message: string } | null,
  rows: new Map<string, StoredUser>(),
  calls: [] as Array<{ payload: Record<string, unknown>; options: Record<string, unknown> | undefined }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(async () => {
    if (harness.clerkError) throw harness.clerkError;
    return harness.clerkUser;
  }),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "users") throw new Error(`Unexpected table: ${table}`);
      return {
        upsert: async (payload: StoredUser, options?: Record<string, unknown>) => {
          harness.calls.push({ payload, options });
          if (harness.upsertError) return { data: null, error: harness.upsertError };

          const existing = harness.rows.get(payload.id);
          if (!existing || !options?.ignoreDuplicates) {
            harness.rows.set(payload.id, { ...existing, ...payload });
          }
          return { data: null, error: null };
        },
      };
    },
  }),
}));

import { ensureUserRecord } from "./user-provisioning";

beforeEach(() => {
  harness.clerkUser = {
    id: "user_owner",
    primaryEmailAddress: { emailAddress: "owner@example.com" },
    emailAddresses: [{ emailAddress: "owner@example.com" }],
  };
  harness.clerkError = null;
  harness.upsertError = null;
  harness.rows = new Map();
  harness.calls = [];
});

describe("ensureUserRecord", () => {
  it("surfaces Supabase provisioning failures instead of admitting a dashboard session without a user row", async () => {
    harness.upsertError = { message: "database unavailable" };

    await expect(ensureUserRecord("user_owner")).rejects.toThrow("Unable to provision user record");
  });

  it("atomically provisions concurrent first dashboard visits as one Clerk-owned user", async () => {
    await expect(Promise.all([
      ensureUserRecord("user_owner"),
      ensureUserRecord("user_owner"),
    ])).resolves.toEqual([undefined, undefined]);

    expect(harness.rows.size).toBe(1);
    expect(harness.rows.get("user_owner")).toMatchObject({
      id: "user_owner",
      email: "owner@example.com",
    });
  });

  it("reconciles a changed Clerk primary email without resetting existing product state", async () => {
    harness.rows.set("user_owner", {
      id: "user_owner",
      email: "old-owner@example.com",
      plan: "growth",
      credits_remaining: 287,
      onboarding_completed: true,
    });
    harness.clerkUser = {
      id: "user_owner",
      primaryEmailAddress: { emailAddress: "new-owner@example.com" },
      emailAddresses: [{ emailAddress: "new-owner@example.com" }],
    };

    await ensureUserRecord("user_owner");

    expect(harness.rows.get("user_owner")).toEqual({
      id: "user_owner",
      email: "new-owner@example.com",
      plan: "growth",
      credits_remaining: 287,
      onboarding_completed: true,
    });
  });

  it("refuses to provision a missing or mismatched Clerk user", async () => {
    harness.clerkUser = null;
    await expect(ensureUserRecord("user_owner")).rejects.toThrow("Unable to load Clerk user");
    expect(harness.calls).toEqual([]);

    harness.clerkUser = {
      id: "user_other",
      primaryEmailAddress: { emailAddress: "other@example.com" },
      emailAddresses: [{ emailAddress: "other@example.com" }],
    };
    await expect(ensureUserRecord("user_owner")).rejects.toThrow("Unable to load Clerk user");
    expect(harness.calls).toEqual([]);
  });
});
