import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const harness = vi.hoisted(() => ({
  clerkUserId: "user_owner" as string | null,
  supabaseUserId: "user_wrong",
  getUser: vi.fn(),
  calls: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: harness.clerkUserId })),
}));

class Query {
  private filters: Array<[string, unknown]> = [];
  constructor(private readonly table: string) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order() { return this; }
  limit() { return this; }
  async single() {
    harness.calls.push({ table: this.table, filters: this.filters });
    return { data: { credits_remaining: 17 }, error: null };
  }
  then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    harness.calls.push({ table: this.table, filters: this.filters });
    return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    auth: { getUser: harness.getUser },
    from: (table: string) => new Query(table),
  }),
}));

import ScorePage from "./page";

beforeEach(() => {
  harness.clerkUserId = "user_owner";
  harness.supabaseUserId = "user_wrong";
  harness.getUser.mockReset().mockResolvedValue({ data: { user: { id: harness.supabaseUserId } } });
  harness.calls = [];
});

describe("ScorePage", () => {
  it("loads credits and history for the Clerk identity, never a Supabase Auth user", async () => {
    const element = await ScorePage();

    expect(harness.getUser).not.toHaveBeenCalled();
    expect(harness.calls).toEqual([
      { table: "users", filters: [["id", "user_owner"]] },
      { table: "scores", filters: [["user_id", "user_owner"]] },
    ]);
    expect(element.props).toMatchObject({ creditsRemaining: 17, recentScores: [] });
  });
});
