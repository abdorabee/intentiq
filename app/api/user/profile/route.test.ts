import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const PROFILE = {
  product_category: "Sales intelligence",
  target_industries: ["B2B SaaS"],
  company_size: "11-50",
  buyer_role: "VP Sales",
  sales_motion: "Outbound",
  deal_size: "$10k-$25k",
  sales_cycle: "30-60 days",
};

const harness = vi.hoisted(() => ({
  userId: "user_owner" as string | null,
  row: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  bypassFilters: false,
  calls: [] as Array<{
    operation: "select" | "update";
    payload?: Record<string, unknown>;
    filters: Array<[string, unknown]>;
  }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

class ProfileQuery {
  private operation: "select" | "update" = "select";
  private payload?: Record<string, unknown>;
  private filters: Array<[string, unknown]> = [];

  select() {
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  private execute() {
    harness.calls.push({ operation: this.operation, payload: this.payload, filters: this.filters });
    const filtered = harness.bypassFilters || !harness.row
      ? harness.row
      : this.filters.every(([column, value]) => harness.row?.[column] === value)
        ? harness.row
        : null;
    return { data: filtered, error: harness.error };
  }

  async single() {
    return this.execute();
  }

  async maybeSingle() {
    return this.execute();
  }

  then<TResult1 = { data: Record<string, unknown> | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Record<string, unknown> | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "users") throw new Error(`Unexpected table: ${table}`);
      return new ProfileQuery();
    },
  }),
}));

import { GET, PUT } from "./route";

function ownerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_owner",
    business_profile: PROFILE,
    onboarding_completed: true,
    product_category: PROFILE.product_category,
    ...overrides,
  };
}

beforeEach(() => {
  harness.userId = "user_owner";
  harness.row = ownerRow();
  harness.error = null;
  harness.bypassFilters = false;
  harness.calls = [];
});

describe("GET /api/user/profile", () => {
  it("requires Clerk authentication before reading storage", async () => {
    harness.userId = null;
    const response = await GET();

    expect(response.status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("returns a generic server error when storage fails", async () => {
    harness.error = { message: "database unavailable" };
    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to fetch profile" });
  });

  it("returns not found when the authenticated user has no profile row", async () => {
    harness.row = null;
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("fails closed if storage returns a profile owned by a different Clerk user", async () => {
    harness.row = ownerRow({ id: "user_other" });
    harness.bypassFilters = true;
    const response = await GET();

    expect(response.status).toBe(500);
    expect(harness.calls[0]?.filters).toEqual([["id", "user_owner"]]);
  });

  it("returns the existing public profile contract for the authenticated owner", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      business_profile: PROFILE,
      onboarding_completed: true,
    });
    expect(harness.calls[0]?.filters).toEqual([["id", "user_owner"]]);
  });
});

describe("PUT /api/user/profile", () => {
  it("requires Clerk authentication before parsing or writing a profile", async () => {
    harness.userId = null;
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: PROFILE }),
    }) as never);

    expect(response.status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("rejects invalid business profiles before touching storage", async () => {
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: { ...PROFILE, product_category: "" } }),
    }) as never);

    expect(response.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("returns a generic server error when profile storage rejects the update", async () => {
    harness.error = { message: "database unavailable" };
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: PROFILE }),
    }) as never);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to save profile" });
  });

  it("does not report success when no authenticated profile row was changed", async () => {
    harness.row = null;
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: PROFILE }),
    }) as never);

    expect(response.status).toBe(404);
  });

  it("fails closed if a mutation result is not owned by the authenticated Clerk user", async () => {
    harness.row = ownerRow({ id: "user_other" });
    harness.bypassFilters = true;
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: PROFILE }),
    }) as never);

    expect(response.status).toBe(500);
    expect(harness.calls[0]?.filters).toEqual([["id", "user_owner"]]);
  });

  it("writes the scoring profile without completing onboarding before activation", async () => {
    const response = await PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ business_profile: PROFILE }),
    }) as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(harness.calls[0]).toEqual({
      operation: "update",
      payload: {
        business_profile: PROFILE,
        product_category: "Sales intelligence",
      },
      filters: [["id", "user_owner"]],
    });
  });
});
