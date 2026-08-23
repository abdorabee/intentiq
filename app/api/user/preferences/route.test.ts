import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const harness = vi.hoisted(() => ({
  userId: "user_123" as string | null,
  row: null as Record<string, unknown> | null,
  calls: [] as Array<{ operation: string; payload?: Record<string, unknown>; filters: Array<[string, unknown]> }>,
  mutationReturnsNoRow: false,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

function persistedRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user_123",
    theme: "system",
    sidebar_collapsed: false,
    analytics_enabled: true,
    onboarding_version: 0,
    onboarding_step: 0,
    onboarding_draft: {},
    tour_version: 0,
    tour_status: "not_started",
    tour_step: 0,
    tour_updated_at: null,
    updated_at: "2026-08-23T12:00:00.000Z",
    ...overrides,
  };
}

class PreferencesQuery {
  private operation = "select";
  private payload?: Record<string, unknown>;
  private filters: Array<[string, unknown]> = [];

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload: Record<string, unknown>) {
    this.operation = "upsert";
    this.payload = payload;
    return this;
  }

  async maybeSingle() {
    harness.calls.push({ operation: this.operation, payload: this.payload, filters: this.filters });
    return { data: harness.row, error: null };
  }

  async single() {
    harness.calls.push({ operation: this.operation, payload: this.payload, filters: this.filters });
    if (harness.mutationReturnsNoRow) return { data: null, error: null };
    if (this.operation === "insert") {
      harness.row = persistedRow(this.payload);
    } else if (this.operation === "upsert") {
      harness.row = persistedRow({ ...(harness.row ?? {}), ...this.payload });
    }
    return { data: harness.row, error: null };
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "user_preferences") throw new Error(`Unexpected table: ${table}`);
      return new PreferencesQuery();
    },
  }),
}));

import { GET, PATCH } from "./route";

beforeEach(() => {
  harness.userId = "user_123";
  harness.row = null;
  harness.calls = [];
  harness.mutationReturnsNoRow = false;
});

describe("GET /api/user/preferences", () => {
  it("requires Clerk authentication", async () => {
    harness.userId = null;
    const response = await GET();
    expect(response.status).toBe(401);
    expect(harness.calls).toEqual([]);
  });

  it("creates a missing row for exactly the authenticated Clerk user", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      preferences: { theme: "system", sidebar_collapsed: false },
    });
    expect(harness.calls).toEqual([
      { operation: "select", filters: [["user_id", "user_123"]], payload: undefined },
      { operation: "insert", filters: [], payload: { user_id: "user_123" } },
    ]);
  });
});

describe("PATCH /api/user/preferences", () => {
  it("rejects unknown fields before touching storage", async () => {
    const response = await PATCH(new Request("http://localhost/api/user/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: "dark", user_id: "user_other" }),
    }));
    expect(response.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("upserts explicit false values and verifies the authenticated row", async () => {
    harness.row = persistedRow({ sidebar_collapsed: true, analytics_enabled: true });
    const response = await PATCH(new Request("http://localhost/api/user/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sidebar_collapsed: false, analytics_enabled: false }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      preferences: { sidebar_collapsed: false, analytics_enabled: false },
    });
    expect(harness.calls).toEqual([
      {
        operation: "upsert",
        payload: { user_id: "user_123", sidebar_collapsed: false, analytics_enabled: false },
        filters: [["user_id", "user_123"]],
      },
    ]);
  });

  it("fails closed when Supabase returns no changed row", async () => {
    harness.mutationReturnsNoRow = true;
    const response = await PATCH(new Request("http://localhost/api/user/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: "dark" }),
    }));
    expect(response.status).toBe(500);
  });
});
