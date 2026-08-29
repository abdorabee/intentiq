import { describe, expect, it } from "vitest";

import {
  buildBusinessProfile,
  createOnboardingState,
  getOnboardingRedirect,
  onboardingReducer,
  validateOnboardingStep,
} from "./onboarding-profile";

const COMPLETE_DRAFT = {
  product_category: "SaaS / Software",
  target_industries: ["Technology", "Financial Services"],
  company_size: "Mid-Market (201-1000)",
  buyer_role: "VP / Director",
  sales_motion: "Outbound (cold outreach)",
  deal_size: "$25K - $100K",
  sales_cycle: "1-3 months",
};

describe("validateOnboardingStep", () => {
  it("requires product category and industries/company_size; steps 2-3 are optional", () => {
    const state = createOnboardingState();

    expect(validateOnboardingStep(0, state.profile)).toEqual({
      product_category: "Choose what your company sells.",
    });
    expect(validateOnboardingStep(1, state.profile)).toEqual({
      target_industries: "Choose at least one target industry.",
      company_size: "Choose an ideal company size.",
    });
    expect(validateOnboardingStep(2, state.profile)).toEqual({});
    expect(validateOnboardingStep(3, state.profile)).toEqual({});
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

  it("returns null when required values are missing (only product_category, target_industries, company_size)", () => {
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      target_industries: [],
    })).toBeNull();
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      product_category: "   ",
    })).toBeNull();
  });

  it("allows optional commercial fields (buyer_role, sales_motion, deal_size, sales_cycle) to be empty", () => {
    const minimalProfile = {
      product_category: "SaaS / Software",
      target_industries: ["Technology"],
      company_size: "Enterprise (1000+)",
      buyer_role: "",
      sales_motion: "",
      deal_size: "",
      sales_cycle: "",
    };
    const result = buildBusinessProfile(minimalProfile);
    expect(result).not.toBeNull();
    expect(result?.product_category).toBe("SaaS / Software");
    expect(result?.target_industries).toEqual(["Technology"]);
    expect(result?.company_size).toBe("Enterprise (1000+)");
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
