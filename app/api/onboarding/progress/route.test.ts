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
  row: null as Record<string, unknown> | null,
  noRow: false,
  bypassFilters: false,
  calls: [] as Array<{ payload: Record<string, unknown>; filters: Array<[string, unknown]> }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

class ProgressQuery {
  private payload: Record<string, unknown> = {};
  private filters: Array<[string, unknown]> = [];

  upsert(payload: Record<string, unknown>) {
    this.payload = payload;
    return this;
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  async single() {
    harness.calls.push({ payload: this.payload, filters: this.filters });
    if (harness.noRow) return { data: null, error: null };
    const row = harness.row ?? {
      ...this.payload,
      updated_at: "2026-08-23T18:00:00.000Z",
    };
    const filtered = harness.bypassFilters || this.filters.every(([key, value]) => row[key] === value)
      ? row
      : null;
    return { data: filtered, error: null };
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "user_preferences") throw new Error(`Unexpected table: ${table}`);
      return new ProgressQuery();
    },
  }),
}));

import { PATCH } from "./route";

beforeEach(() => {
  harness.userId = "user_owner";
  harness.row = null;
  harness.noRow = false;
  harness.bypassFilters = false;
  harness.calls = [];
});

describe("PATCH /api/onboarding/progress", () => {
  it("requires Clerk authentication before parsing or writing progress", async () => {
    harness.userId = null;

    const response = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 1, draft: PROFILE }),
    }));

    expect(response.status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("rejects activation-stage progress until the complete profile is valid", async () => {
    const response = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 2, draft: { ...PROFILE, sales_cycle: "" } }),
    }));

    expect(response.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("persists only the authenticated user and returns the authoritative saved draft", async () => {
    const response = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 1, draft: PROFILE }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: {
        step: 1,
        draft: PROFILE,
        onboarding_version: 1,
        updated_at: "2026-08-23T18:00:00.000Z",
      },
    });
    expect(harness.calls).toEqual([{
      payload: {
        user_id: "user_owner",
        onboarding_step: 1,
        onboarding_draft: PROFILE,
        onboarding_version: 1,
      },
      filters: [["user_id", "user_owner"]],
    }]);
  });

  it("does not report saved when Supabase returns zero rows", async () => {
    harness.noRow = true;

    const response = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 1, draft: PROFILE }),
    }));

    expect(response.status).toBe(500);
  });

  it("fails closed when storage returns a different user's progress", async () => {
    harness.bypassFilters = true;
    harness.row = {
      user_id: "user_other",
      onboarding_step: 1,
      onboarding_draft: PROFILE,
      onboarding_version: 1,
      updated_at: "2026-08-23T18:00:00.000Z",
    };

    const response = await PATCH(new Request("http://localhost/api/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify({ step: 1, draft: PROFILE }),
    }));

    expect(response.status).toBe(500);
    expect(harness.calls[0]?.filters).toEqual([["user_id", "user_owner"]]);
  });
});
