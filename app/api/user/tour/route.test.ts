import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const harness = vi.hoisted(() => ({
  userId: "user_123" as string | null,
  row: null as Record<string, unknown> | null,
  calls: [] as Array<{ operation: string; payload?: Record<string, unknown>; filters: Array<[string, unknown]> }>,
  mutationError: null as null | { message: string },
  mutationReturnsNoRow: false,
  zeroRowRaceRow: null as Record<string, unknown> | null,
  mutationRow: null as Record<string, unknown> | null,
  bypassFilters: false,
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
    onboarding_version: 1,
    onboarding_revision: 0,
    onboarding_step: 2,
    onboarding_draft: {},
    tour_version: 1,
    tour_status: "in_progress",
    tour_step: 1,
    tour_updated_at: "2026-08-24T01:00:00.000Z",
    updated_at: "2026-08-24T01:00:00.000Z",
    ...overrides,
  };
}

class TourQuery {
  private operation = "select";
  private payload?: Record<string, unknown>;
  private filters: Array<[string, unknown]> = [];

  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  update(payload: Record<string, unknown>) { this.operation = "update"; this.payload = payload; return this; }

  private filtered(row: Record<string, unknown> | null) {
    if (!row || harness.bypassFilters) return row;
    return this.filters.every(([column, value]) => row[column] === value) ? row : null;
  }

  async maybeSingle() {
    harness.calls.push({ operation: this.operation, payload: this.payload, filters: this.filters });
    return { data: this.filtered(harness.row), error: null };
  }

  async single() {
    harness.calls.push({ operation: this.operation, payload: this.payload, filters: this.filters });
    if (harness.mutationError) return { data: null, error: harness.mutationError };
    if (harness.mutationReturnsNoRow) {
      if (harness.zeroRowRaceRow) harness.row = harness.zeroRowRaceRow;
      return { data: null, error: null };
    }
    if (this.operation === "update") {
      if (!this.filtered(harness.row)) return { data: null, error: null };
      harness.row = harness.mutationRow ?? persistedRow({ ...(harness.row ?? {}), ...this.payload });
      return { data: harness.row, error: null };
    }
    return { data: this.filtered(harness.row), error: null };
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "user_preferences") throw new Error(`Unexpected table: ${table}`);
      return new TourQuery();
    },
  }),
}));

import { GET, handleTourMutation } from "./route";

beforeEach(() => {
  harness.userId = "user_123";
  harness.row = persistedRow();
  harness.calls = [];
  harness.mutationError = null;
  harness.mutationReturnsNoRow = false;
  harness.zeroRowRaceRow = null;
  harness.mutationRow = null;
  harness.bypassFilters = false;
});

function request(body: unknown) {
  return new Request("http://localhost/api/user/tour", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/user/tour", () => {
  it("returns only the authenticated server-owned tour projection", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tour: {
        tour_version: 1,
        tour_status: "in_progress",
        tour_step: 1,
        tour_updated_at: "2026-08-24T01:00:00.000Z",
      },
    });
    expect(harness.calls[0].filters).toEqual([["user_id", "user_123"]]);
  });

  it("fails closed when persisted tour storage is malformed", async () => {
    harness.row = persistedRow({ tour_step: 99 });
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to load tour progress" });
  });
});

describe("POST /api/user/tour", () => {
  it("requires authentication and rejects client-owned state fields", async () => {
    harness.userId = null;
    expect((await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }), 1)).status).toBe(401);
    harness.userId = "user_123";
    expect((await handleTourMutation(request({ action: "next", tour_step: 4, expected: { version: 1, status: "in_progress", step: 1 } }), 1)).status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("keeps every mutation dormant while the active version is zero", async () => {
    const response = await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }), 0);
    expect(response.status).toBe(409);
    expect(harness.calls).toHaveLength(1);
  });

  it("computes the next step on the server and compare-and-swaps the authenticated row", async () => {
    const response = await handleTourMutation(
      request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }),
      1,
      () => new Date("2026-08-24T02:00:00.000Z"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tour: {
        tour_version: 1,
        tour_status: "in_progress",
        tour_step: 2,
        tour_updated_at: "2026-08-24T02:00:00.000Z",
      },
    });
    expect(harness.calls[1]).toEqual({
      operation: "update",
      payload: {
        tour_version: 1,
        tour_status: "in_progress",
        tour_step: 2,
        tour_updated_at: "2026-08-24T02:00:00.000Z",
      },
      filters: [
        ["user_id", "user_123"],
        ["tour_version", 1],
        ["tour_status", "in_progress"],
        ["tour_step", 1],
      ],
    });
  });

  it("rejects stale client expectations before writing", async () => {
    const response = await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 0 } }), 1);
    expect(response.status).toBe(409);
    expect(harness.calls).toHaveLength(1);
  });

  it("fails closed for storage errors, zero-row writes, and cross-owner results", async () => {
    harness.mutationError = { message: "offline" };
    expect((await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }), 1)).status).toBe(500);

    harness.calls = [];
    harness.mutationError = null;
    harness.mutationReturnsNoRow = true;
    harness.zeroRowRaceRow = persistedRow({ tour_step: 3, tour_updated_at: "2026-08-24T02:01:00.000Z" });
    const conflict = await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }), 1);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ tour: { tour_step: 3 } });

    harness.calls = [];
    harness.mutationReturnsNoRow = false;
    harness.row = persistedRow();
    harness.bypassFilters = true;
    harness.mutationRow = persistedRow({ user_id: "user_other", tour_step: 2 });
    expect((await handleTourMutation(request({ action: "next", expected: { version: 1, status: "in_progress", step: 1 } }), 1)).status).toBe(500);
  });
});
