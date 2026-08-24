import { describe, expect, it } from "vitest";

import {
  buildBusinessProfile,
  buildOnboardingPreferencesPatch,
  buildOnboardingProfilePut,
  canSkipOnboardingStep,
  clampOnboardingStep,
  createOnboardingState,
  getOnboardingCompleteDestination,
  getOnboardingRedirect,
  onboardingReducer,
  resolveOnboardingResume,
  runFirstScoreAttempt,
  validateOnboardingStep,
} from "./onboarding-profile";
import { parsePreferencesPatch } from "./user-preferences";

const COMPLETE_DRAFT = {
  product_category: "SaaS / Software",
  target_industries: ["Technology", "Financial Services"],
  company_size: "Mid-Market (201-1000)",
  buyer_role: "VP / Director",
  sales_motion: "Outbound (cold outreach)",
  deal_size: "$25K - $100K",
  sales_cycle: "1-3 months",
};

const REQUIRED_ONLY_DRAFT = {
  product_category: "SaaS / Software",
  target_industries: ["Technology"],
  company_size: "SMB (51-200)",
  buyer_role: "",
  sales_motion: "",
  deal_size: "",
  sales_cycle: "",
};

describe("validateOnboardingStep", () => {
  it("requires offer and accounts, and motion/commercial only when continuing", () => {
    const state = createOnboardingState();

    expect(validateOnboardingStep(0, state.profile)).toEqual({
      product_category: "Choose what your company sells.",
    });
    expect(validateOnboardingStep(1, state.profile)).toEqual({
      target_industries: "Choose at least one target industry.",
      company_size: "Choose an ideal company size.",
    });
    expect(validateOnboardingStep(2, state.profile)).toEqual({
      buyer_role: "Choose the primary buyer role.",
      sales_motion: "Choose your sales motion.",
    });
    expect(validateOnboardingStep(3, state.profile)).toEqual({
      deal_size: "Choose a typical deal size.",
      sales_cycle: "Choose a typical sales cycle.",
    });
    expect(validateOnboardingStep(4, state.profile)).toEqual({});
  });
});

describe("skippable onboarding steps", () => {
  it("allows skip on motion, commercial, and first score only", () => {
    expect(canSkipOnboardingStep(0)).toBe(false);
    expect(canSkipOnboardingStep(1)).toBe(false);
    expect(canSkipOnboardingStep(2)).toBe(true);
    expect(canSkipOnboardingStep(3)).toBe(true);
    expect(canSkipOnboardingStep(4)).toBe(true);
  });

  it("advances a skippable step without requiring those fields", () => {
    let state = createOnboardingState(REQUIRED_ONLY_DRAFT, 2);
    expect(validateOnboardingStep(2, state.profile).buyer_role).toBeTruthy();

    state = onboardingReducer(state, { type: "skip_step" });
    expect(state.step).toBe(3);
    expect(state.profile).toEqual(REQUIRED_ONLY_DRAFT);

    state = onboardingReducer(state, { type: "skip_step" });
    expect(state.step).toBe(4);

    state = onboardingReducer(state, { type: "skip_step" });
    expect(state.step).toBe(4);
  });

  it("does not skip required offer or accounts steps", () => {
    let state = createOnboardingState();
    state = onboardingReducer(state, { type: "skip_step" });
    expect(state.step).toBe(0);

    state = onboardingReducer(state, { type: "next_step" });
    state = onboardingReducer(state, { type: "skip_step" });
    expect(state.step).toBe(1);
  });
});

describe("buildBusinessProfile", () => {
  it("builds the exact BusinessProfile payload with multiple industries", () => {
    expect(buildBusinessProfile(COMPLETE_DRAFT)).toEqual(COMPLETE_DRAFT);
  });

  it("keeps custom values while normalizing whitespace and duplicate industries", () => {
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      product_category: "  Revenue operations consulting  ",
      target_industries: [
        " Climate technology ",
        "Technology",
        "climate technology",
        " ",
      ],
      buyer_role: "  Revenue Operations Leader ",
    })).toEqual({
      ...COMPLETE_DRAFT,
      product_category: "Revenue operations consulting",
      target_industries: ["Climate technology", "Technology"],
      buyer_role: "Revenue Operations Leader",
    });
  });

  it("saves a profile when skippable motion and commercial fields are blank", () => {
    expect(buildBusinessProfile(REQUIRED_ONLY_DRAFT)).toEqual(REQUIRED_ONLY_DRAFT);
  });

  it("returns null when required offer or account fields are missing", () => {
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      target_industries: [],
    })).toBeNull();
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      company_size: "   ",
    })).toBeNull();
  });
});

describe("persist and resume", () => {
  it("clamps a stored step and hydrates the draft after refresh", () => {
    const patch = buildOnboardingPreferencesPatch(2, REQUIRED_ONLY_DRAFT);
    expect(patch).toEqual({
      onboarding_step: 2,
      onboarding_draft: REQUIRED_ONLY_DRAFT,
    });

    const parsed = parsePreferencesPatch(patch);
    expect(parsed.success).toBe(true);

    const resumed = resolveOnboardingResume({
      step: patch.onboarding_step,
      draft: patch.onboarding_draft,
      profile: null,
    });
    expect(resumed.step).toBe(2);
    expect(resumed.profile).toEqual(REQUIRED_ONLY_DRAFT);
  });

  it("resumes from preferences over a stored selling profile and ignores invalid steps", () => {
    const resumed = resolveOnboardingResume({
      step: 99,
      draft: { product_category: "Consulting / Services" },
      profile: COMPLETE_DRAFT,
    });

    expect(clampOnboardingStep(99)).toBe(4);
    expect(resumed.step).toBe(4);
    expect(resumed.profile.product_category).toBe("Consulting / Services");
    expect(resumed.profile.target_industries).toEqual(COMPLETE_DRAFT.target_industries);
    expect(resumed.profile.company_size).toBe(COMPLETE_DRAFT.company_size);
  });

  it("starts at offer when no step was persisted", () => {
    expect(createOnboardingState(COMPLETE_DRAFT).step).toBe(0);
    expect(resolveOnboardingResume({ profile: COMPLETE_DRAFT }).step).toBe(0);
  });
});

describe("onboardingReducer", () => {
  it("retains entered data when navigating back", () => {
    let state = createOnboardingState();
    state = onboardingReducer(state, {
      type: "update_field",
      field: "product_category",
      value: "SaaS / Software",
    });
    state = onboardingReducer(state, { type: "next_step" });
    state = onboardingReducer(state, { type: "previous_step" });

    expect(state.step).toBe(0);
    expect(state.profile.product_category).toBe("SaaS / Software");
  });

  it("can reach the first-score step", () => {
    let state = createOnboardingState(REQUIRED_ONLY_DRAFT);
    state = onboardingReducer(state, { type: "go_to_step", step: 4 });
    expect(state.step).toBe(4);
    state = onboardingReducer(state, { type: "next_step" });
    expect(state.step).toBe(4);
  });

  it("preserves the complete draft after a save error and supports retry", () => {
    let state = createOnboardingState(COMPLETE_DRAFT);
    state = onboardingReducer(state, { type: "save_started" });
    state = onboardingReducer(state, {
      type: "save_failed",
      message: "We could not save your profile.",
    });

    expect(state.profile).toEqual(COMPLETE_DRAFT);
    expect(state.saveStatus).toBe("error");
    expect(state.saveError).toBe("We could not save your profile.");

    state = onboardingReducer(state, { type: "save_started" });
    expect(state.profile).toEqual(COMPLETE_DRAFT);
    expect(state.saveStatus).toBe("saving");
    expect(state.saveError).toBeNull();

    state = onboardingReducer(state, { type: "save_succeeded" });
    expect(state.saveStatus).toBe("idle");
  });
});

describe("getOnboardingRedirect", () => {
  it("redirects incomplete users away from dashboard routes", () => {
    expect(getOnboardingRedirect(false, "dashboard")).toBe("/onboarding");
    expect(getOnboardingRedirect(true, "dashboard")).toBeNull();
  });

  it("redirects completed users away from onboarding", () => {
    expect(getOnboardingRedirect(true, "onboarding")).toBe("/dashboard");
    expect(getOnboardingRedirect(false, "onboarding")).toBeNull();
  });
});

describe("first-score onboarding completion", () => {
  it("persists a draft profile without completing, then stays incomplete when score fails", async () => {
    const puts: Array<{ onboarding_completed: boolean }> = [];
    let scored = false;

    const result = await runFirstScoreAttempt("stripe.com", COMPLETE_DRAFT, {
      putProfile: async (payload) => {
        puts.push({ onboarding_completed: payload.onboarding_completed });
        return { ok: true };
      },
      postScore: async () => {
        scored = true;
        return { ok: false, error: "We could not score that domain." };
      },
    });

    expect(scored).toBe(true);
    expect(puts).toEqual([{ onboarding_completed: false }]);
    expect(result).toEqual({
      status: "failed",
      error: "We could not score that domain.",
      onboardingCompleted: false,
    });
    expect(buildOnboardingProfilePut(COMPLETE_DRAFT, false)).toEqual({
      business_profile: COMPLETE_DRAFT,
      onboarding_completed: false,
    });
  });

  it("marks onboarding complete only after a successful first score", async () => {
    const puts: boolean[] = [];

    const result = await runFirstScoreAttempt("stripe.com", COMPLETE_DRAFT, {
      putProfile: async (payload) => {
        puts.push(payload.onboarding_completed);
        return { ok: true };
      },
      postScore: async () => ({ ok: true }),
    });

    expect(puts).toEqual([false, true]);
    expect(result).toEqual({
      status: "completed",
      domain: "stripe.com",
      destination: "/score?domain=stripe.com",
    });
  });

  it("builds a completing profile PUT for skip and continue-without-score", () => {
    expect(buildOnboardingProfilePut(COMPLETE_DRAFT, true)).toEqual({
      business_profile: COMPLETE_DRAFT,
      onboarding_completed: true,
    });
  });
});

describe("post-complete destination", () => {
  it("lands on Score without a first domain", () => {
    expect(getOnboardingCompleteDestination()).toBe("/score");
    expect(getOnboardingCompleteDestination("")).toBe("/score");
    expect(getOnboardingCompleteDestination("   ")).toBe("/score");
  });

  it("lands on Score with the scored domain", () => {
    expect(getOnboardingCompleteDestination("stripe.com")).toBe("/score?domain=stripe.com");
    expect(getOnboardingCompleteDestination(" linear.app ")).toBe("/score?domain=linear.app");
  });
});
