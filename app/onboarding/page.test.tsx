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

const DRAFT = { ...PROFILE, buyer_role: "CRO" };

const harness = vi.hoisted(() => ({
  userId: "user_owner" as string | null,
  user: null as Record<string, unknown> | null,
  scoreCount: 0,
  watchlistCount: 0,
  calls: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
  preferences: null as Record<string, unknown> | null,
  profileError: null as string | null,
  evidenceError: null as "scores" | "watchlist" | null,
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: harness.userId })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("@/lib/user-provisioning", () => ({ ensureUserRecord: vi.fn() }));
vi.mock("@/lib/user-preferences-server", () => ({ getOrCreateUserPreferences: vi.fn(async () => harness.preferences) }));

class Query {
  private filters: Array<[string, unknown]> = [];
  constructor(private readonly table: string) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  async single() {
    harness.calls.push({ table: this.table, filters: this.filters });
    return {
      data: this.table === "users" ? harness.user : null,
      error: this.table === "users" && harness.profileError ? { message: harness.profileError } : null,
    };
  }
  then<TResult1 = { data: null; count: number; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: null; count: number; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    harness.calls.push({ table: this.table, filters: this.filters });
    const count = this.table === "scores" ? harness.scoreCount : harness.watchlistCount;
    const error = harness.evidenceError === this.table ? { message: "evidence unavailable" } : null;
    return Promise.resolve({ data: null, count, error }).then(onfulfilled, onrejected);
  }
}

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdmin: () => ({ from: (table: string) => new Query(table) }),
}));

import OnboardingPage from "./page";

beforeEach(() => {
  harness.userId = "user_owner";
  harness.user = {
    id: "user_owner",
    business_profile: PROFILE,
    onboarding_completed: false,
    onboarding_completed_at: null,
    onboarding_completed_version: 0,
  };
  harness.scoreCount = 0;
  harness.watchlistCount = 0;
  harness.calls = [];
  harness.profileError = null;
  harness.evidenceError = null;
  harness.preferences = {
    onboarding_step: 1,
    onboarding_draft: DRAFT,
    onboarding_version: 1,
    onboarding_revision: 7,
  };
});

describe("OnboardingPage", () => {
  it("hydrates the persisted draft and current step and derives activation from owner data", async () => {
    harness.scoreCount = 1;

    const element = await OnboardingPage();

    expect(element.props).toMatchObject({
      initialProfile: DRAFT,
      initialStep: 1,
      initialActivation: true,
      initialRevision: 7,
    });
    expect(harness.calls.find((call) => call.table === "users")?.filters).toEqual([["id", "user_owner"]]);
    expect(harness.calls.find((call) => call.table === "scores")?.filters).toEqual([["user_id", "user_owner"]]);
    expect(harness.calls.find((call) => call.table === "watchlist")?.filters).toEqual([
      ["user_id", "user_owner"],
      ["is_active", true],
    ]);
  });

  it("falls back to the persisted business profile when the preference draft is invalid", async () => {
    harness.preferences = {
      onboarding_step: 0,
      onboarding_draft: {},
      onboarding_version: 0,
      onboarding_revision: 0,
    };

    const element = await OnboardingPage();

    expect(element.props.initialProfile).toEqual(PROFILE);
    expect(element.props.initialStep).toBe(0);
  });

  it("redirects only for the consistent completed tuple", async () => {
    harness.user = {
      id: "user_owner",
      business_profile: PROFILE,
      onboarding_completed: true,
      onboarding_completed_at: "2026-08-23T18:00:00.000Z",
      onboarding_completed_version: 1,
    };

    await expect(OnboardingPage()).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("fails closed when the owner row is missing, unreadable, or belongs to another user", async () => {
    harness.user = null;
    await expect(OnboardingPage()).rejects.toThrow("Onboarding profile is unavailable");

    harness.user = {
      id: "user_other",
      business_profile: PROFILE,
      onboarding_completed: false,
      onboarding_completed_at: null,
      onboarding_completed_version: 0,
    };
    await expect(OnboardingPage()).rejects.toThrow("Onboarding profile is unavailable");

    harness.profileError = "storage unavailable";
    await expect(OnboardingPage()).rejects.toThrow("Onboarding profile is unavailable");
  });

  it("fails closed for inconsistent completion state or unavailable activation evidence", async () => {
    harness.user = {
      id: "user_owner",
      business_profile: PROFILE,
      onboarding_completed: true,
      onboarding_completed_at: null,
      onboarding_completed_version: 1,
    };
    await expect(OnboardingPage()).rejects.toThrow("Onboarding profile is unavailable");

    harness.user = {
      id: "user_owner",
      business_profile: PROFILE,
      onboarding_completed: false,
      onboarding_completed_at: null,
      onboarding_completed_version: 0,
    };
    harness.evidenceError = "scores";
    await expect(OnboardingPage()).rejects.toThrow("Onboarding activation evidence is unavailable");
  });
});
