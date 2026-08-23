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

type Call = {
  table: string;
  operation: "select" | "update";
  payload?: Record<string, unknown>;
  filters: Array<[string, unknown]>;
};

const harness = vi.hoisted(() => ({
  userId: "user_owner" as string | null,
  user: null as Record<string, unknown> | null,
  score: null as Record<string, unknown> | null,
  watchlist: null as Record<string, unknown> | null,
  updateNoRow: false,
  completeAfterZeroRow: false,
  deleteAfterZeroRow: false,
  bypassFilters: false,
  calls: [] as Call[],
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

class CompletionQuery {
  private operation: "select" | "update" = "select";
  private payload?: Record<string, unknown>;
  private filters: Array<[string, unknown]> = [];

  constructor(private readonly table: string) {}

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

  limit() {
    return this;
  }

  async maybeSingle() {
    harness.calls.push({
      table: this.table,
      operation: this.operation,
      payload: this.payload,
      filters: this.filters,
    });

    if (this.operation === "update" && harness.updateNoRow) {
      harness.updateNoRow = false;
      if (harness.completeAfterZeroRow) {
        harness.user = {
          ...harness.user,
          onboarding_completed: true,
          onboarding_completed_at: "2026-08-23T17:00:00.000Z",
          onboarding_completed_version: 1,
        };
      } else if (harness.deleteAfterZeroRow) {
        harness.user = null;
      }
      return { data: null, error: null };
    }

    let row = this.table === "users"
      ? harness.user
      : this.table === "scores"
        ? harness.score
        : harness.watchlist;
    const matches = !row || harness.bypassFilters || this.filters.every(([key, value]) => row?.[key] === value);
    row = matches ? row : null;

    if (row && this.operation === "update") {
      row = { ...row, ...this.payload };
      harness.user = row;
    }
    return { data: row, error: null };
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => new CompletionQuery(table),
  }),
}));

import { POST } from "./route";

function owner(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_owner",
    business_profile: PROFILE,
    onboarding_completed: false,
    onboarding_completed_at: null,
    onboarding_completed_version: 0,
    ...overrides,
  };
}

async function request(reason: "activation" | "skip") {
  return POST(new Request("http://localhost/api/onboarding/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  }));
}

beforeEach(() => {
  harness.userId = "user_owner";
  harness.user = owner();
  harness.score = null;
  harness.watchlist = null;
  harness.updateNoRow = false;
  harness.completeAfterZeroRow = false;
  harness.deleteAfterZeroRow = false;
  harness.bypassFilters = false;
  harness.calls = [];
});

describe("POST /api/onboarding/complete", () => {
  it("requires Clerk authentication before reading activation evidence", async () => {
    harness.userId = null;

    const response = await request("skip");

    expect(response.status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("refuses activation completion without a persisted score or watchlist row", async () => {
    const response = await request("activation");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "activation_required" });
    expect(harness.calls.filter((call) => call.table === "scores")[0]?.filters).toEqual([
      ["user_id", "user_owner"],
    ]);
    expect(harness.calls.filter((call) => call.table === "watchlist")[0]?.filters).toEqual([
      ["user_id", "user_owner"],
      ["is_active", true],
    ]);
  });

  it("completes only after verifying a persisted scorable score for the Clerk user", async () => {
    harness.score = { id: "score_1", user_id: "user_owner" };

    const response = await request("activation");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completion).toMatchObject({
      onboarding_completed: true,
      onboarding_completed_version: 1,
      activation_source: "score",
    });
    expect(body.completion.onboarding_completed_at).toEqual(expect.any(String));
    expect(harness.calls.find((call) => call.operation === "update")).toMatchObject({
      table: "users",
      payload: {
        onboarding_completed: true,
        onboarding_completed_version: 1,
      },
      filters: [
        ["id", "user_owner"],
        ["onboarding_completed", false],
      ],
    });
  });

  it("allows explicit skip only after a complete profile is persisted", async () => {
    harness.user = owner({ business_profile: null });
    expect((await request("skip")).status).toBe(409);

    harness.user = owner();
    const response = await request("skip");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      completion: {
        onboarding_completed: true,
        onboarding_completed_version: 1,
        activation_source: "skip",
      },
    });
  });

  it("returns existing completion idempotently without replaying the mutation", async () => {
    harness.user = owner({
      onboarding_completed: true,
      onboarding_completed_at: "2026-08-23T17:00:00.000Z",
      onboarding_completed_version: 1,
    });

    const response = await request("activation");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      completion: {
        onboarding_completed: true,
        onboarding_completed_at: "2026-08-23T17:00:00.000Z",
        onboarding_completed_version: 1,
        activation_source: "existing",
      },
    });
    expect(harness.calls.some((call) => call.operation === "update")).toBe(false);
  });

  it("reselects and verifies authoritative completion when a concurrent update returns zero rows", async () => {
    harness.score = { id: "score_1", user_id: "user_owner" };
    harness.updateNoRow = true;
    harness.completeAfterZeroRow = true;

    const response = await request("activation");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      completion: { onboarding_completed: true, onboarding_completed_version: 1 },
    });
  });

  it("does not claim completion when an update changes zero rows and reselect stays incomplete", async () => {
    harness.score = { id: "score_1", user_id: "user_owner" };
    harness.updateNoRow = true;

    const response = await request("activation");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to complete onboarding" });
  });

  it("does not crash or claim completion when the owner row disappears after a zero-row update", async () => {
    harness.score = { id: "score_1", user_id: "user_owner" };
    harness.updateNoRow = true;
    harness.deleteAfterZeroRow = true;

    const response = await request("activation");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to complete onboarding" });
  });

  it("fails closed when storage returns a different user's completion row", async () => {
    harness.bypassFilters = true;
    harness.user = owner({ id: "user_other" });

    const response = await request("skip");

    expect(response.status).toBe(500);
  });
});
