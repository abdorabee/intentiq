import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  userId: "user_123" as string | null,
  plan: "free",
  activeKeys: [] as Array<Record<string, unknown>>,
  insertedRow: null as Record<string, unknown> | null,
  revokedRow: null as Record<string, unknown> | null,
  calls: [] as Array<{ table: string; operation: string; payload?: unknown; filters: Array<[string, unknown]> }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.userId })),
}));

class Query {
  private operation = "select";
  private payload?: unknown;
  private filters: Array<[string, unknown]> = [];

  constructor(private table: string) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order() { return this; }
  insert(payload: unknown) { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: unknown) { this.operation = "update"; this.payload = payload; return this; }
  private record() { harness.calls.push({ table: this.table, operation: this.operation, payload: this.payload, filters: this.filters }); }
  async single() {
    this.record();
    if (this.table === "users") return { data: { plan: harness.plan }, error: null };
    if (this.operation === "insert") return { data: harness.insertedRow, error: harness.insertedRow ? null : { message: "insert failed" } };
    return { data: null, error: null };
  }
  async maybeSingle() {
    this.record();
    return { data: harness.revokedRow, error: null };
  }
  then(resolve: (value: unknown) => unknown) {
    this.record();
    return Promise.resolve({ data: harness.activeKeys, error: null }).then(resolve);
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({ from: (table: string) => new Query(table) }),
}));

import { DELETE, POST } from "./route";

beforeEach(() => {
  harness.userId = "user_123";
  harness.plan = "free";
  harness.activeKeys = [];
  harness.insertedRow = null;
  harness.revokedRow = null;
  harness.calls = [];
});

describe("POST /api/user/api-keys", () => {
  it("rejects invalid labels before generating or storing a key", async () => {
    const response = await POST(new Request("http://localhost/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ label: "   " }),
    }) as never);
    expect(response.status).toBe(400);
    expect(harness.calls).toEqual([]);
  });

  it("enforces the authenticated user's active plan limit", async () => {
    harness.activeKeys = [{ id: "key_existing" }];
    const response = await POST(new Request("http://localhost/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ label: "Production" }),
    }) as never);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ limit: 1 });
  });

  it("returns the secret once after verifying the created owner row", async () => {
    harness.insertedRow = {
      id: "key_new",
      user_id: "user_123",
      label: "Production",
      last_used: null,
      is_active: true,
      created_at: "2026-08-23T12:00:00.000Z",
    };
    const response = await POST(new Request("http://localhost/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ label: "  Production " }),
    }) as never);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.key).toMatch(/^vesperwise_[a-f0-9]{48}$/);
    expect(body.record).not.toHaveProperty("key_hash");
    expect(body.record).not.toHaveProperty("user_id");
  });
});

describe("DELETE /api/user/api-keys", () => {
  it("fails closed when no authenticated owner row was revoked", async () => {
    const response = await DELETE(new Request("http://localhost/api/user/api-keys?id=00000000-0000-4000-8000-000000000002", {
      method: "DELETE",
    }) as never);
    expect(response.status).toBe(404);
  });

  it("returns the verified revoked record", async () => {
    harness.revokedRow = {
      id: "00000000-0000-4000-8000-000000000001",
      user_id: "user_123",
      label: "Production",
      last_used: null,
      is_active: false,
      created_at: "2026-08-23T12:00:00.000Z",
    };
    const response = await DELETE(new Request("http://localhost/api/user/api-keys?id=00000000-0000-4000-8000-000000000001", {
      method: "DELETE",
    }) as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ record: { id: "00000000-0000-4000-8000-000000000001", is_active: false } });
  });
});
