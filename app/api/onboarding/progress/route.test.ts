import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const PROFILE = {
  product_category: "Sales intelligence",
  target_industries: ["B2B SaaS"],
  company_size: "51-200",
  buyer_role: "VP Sales",
  sales_motion: "Outbound",
  deal_size: "$10k-$25k",
  sales_cycle: "30-60 days",
};

const harness = vi.hoisted(() => ({
  userId: "user_owner" as string | null,
  rpcRow: null as Record<string, unknown> | null,
  currentRow: null as Record<string, unknown> | null,
  rpcError: null as string | null,
  currentError: null as string | null,
  bypassOwner: false,
  calls: [] as Array<{ kind: "rpc" | "select"; payload?: Record<string, unknown>; filters?: Array<[string, unknown]> }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

class CurrentQuery {
  private filters: Array<[string, unknown]> = [];
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  async maybeSingle() {
    harness.calls.push({ kind: "select", filters: this.filters });
    if (harness.currentError) return { data: null, error: { message: harness.currentError } };
    const row = harness.currentRow;
    const matches = !row || harness.bypassOwner || this.filters.every(([key, value]) => row[key] === value);
    return { data: matches ? row : null, error: null };
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    rpc: async (name: string, payload: Record<string, unknown>) => {
      if (name !== "save_onboarding_progress") throw new Error(`Unexpected RPC: ${name}`);
      harness.calls.push({ kind: "rpc", payload });
      return {
        data: harness.rpcRow ? [harness.rpcRow] : [],
        error: harness.rpcError ? { message: harness.rpcError } : null,
      };
    },
    from: (table: string) => {
      if (table !== "user_preferences") throw new Error(`Unexpected table: ${table}`);
      return new CurrentQuery();
    },
  }),
}));

import { PATCH } from "./route";

function savedRow(revision = 4, userId = "user_owner") {
  return {
    user_id: userId,
    onboarding_step: 1,
    onboarding_draft: PROFILE,
    onboarding_version: 1,
    onboarding_revision: revision,
    updated_at: "2026-08-23T18:00:00.000Z",
  };
}

function request(revision = 4, draft = PROFILE) {
  return PATCH(new Request("http://localhost/api/onboarding/progress", {
    method: "PATCH",
    body: JSON.stringify({ step: 1, draft, revision }),
  }));
}

beforeEach(() => {
  harness.userId = "user_owner";
  harness.rpcRow = savedRow();
  harness.currentRow = null;
  harness.rpcError = null;
  harness.currentError = null;
  harness.bypassOwner = false;
  harness.calls = [];
});

describe("PATCH /api/onboarding/progress", () => {
  it("requires Clerk authentication before parsing or writing progress", async () => {
    harness.userId = null;
    expect((await request()).status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("rejects missing revisions and invalid activation-stage progress", async () => {
    const noRevision = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 1, draft: PROFILE }),
    }));
    expect(noRevision.status).toBe(400);

    const invalid = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 2, draft: { ...PROFILE, sales_cycle: "" }, revision: 1 }),
    }));
    expect(invalid.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("persists through the monotonic RPC and returns authoritative revision", async () => {
    const response = await request();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: {
        step: 1,
        draft: PROFILE,
        onboarding_version: 1,
        revision: 4,
        updated_at: "2026-08-23T18:00:00.000Z",
      },
    });
    expect(harness.calls).toEqual([{ kind: "rpc", payload: {
      p_user_id: "user_owner",
      p_step: 1,
      p_draft: PROFILE,
      p_version: 1,
      p_revision: 4,
    } }]);
  });

  it("rejects a stale write and returns the newer authoritative durable state", async () => {
    harness.rpcRow = null;
    harness.currentRow = savedRow(5);

    const response = await request(4);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "stale_revision",
      progress: { revision: 5, step: 1 },
    });
    expect(harness.calls[1]).toEqual({ kind: "select", filters: [["user_id", "user_owner"]] });
  });

  it("treats an equal revision as a conflict without changing durable state", async () => {
    harness.rpcRow = null;
    harness.currentRow = savedRow(4);

    const response = await request(4, { ...PROFILE, product_category: "Losing tab edit" });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "stale_revision",
      progress: {
        revision: 4,
        draft: { product_category: "Sales intelligence" },
      },
    });
  });

  it("does not claim saved on RPC errors, missing state, or owner mismatch", async () => {
    harness.rpcError = "storage unavailable";
    expect((await request()).status).toBe(500);

    harness.rpcError = null;
    harness.rpcRow = null;
    harness.currentRow = null;
    expect((await request()).status).toBe(500);

    harness.rpcRow = savedRow(4, "user_other");
    expect((await request()).status).toBe(500);
  });
});
