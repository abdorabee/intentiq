import { describe, expect, it } from "vitest";

import {
  buildBusinessProfile,
  createOnboardingState,
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
  it("groups offer and target-account fields into the first stage", () => {
    const state = createOnboardingState();

    expect(validateOnboardingStep(0, state.profile)).toEqual({
      product_category: "Choose what your company sells.",
      target_industries: "Choose at least one target industry.",
      company_size: "Choose an ideal company size.",
    });
  });

  it("groups buyer and commercial-motion fields into the second stage", () => {
    const state = createOnboardingState();

    expect(validateOnboardingStep(1, state.profile)).toEqual({
      buyer_role: "Choose the primary buyer role.",
      sales_motion: "Choose your sales motion.",
      deal_size: "Choose a typical deal size.",
      sales_cycle: "Choose a typical sales cycle.",
    });
  });

  it("does not require profile fields in the activation stage", () => {
    const state = createOnboardingState();

    expect(validateOnboardingStep(2, state.profile)).toEqual({
    });
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

  it("returns null when any required value is missing", () => {
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      target_industries: [],
    })).toBeNull();
    expect(buildBusinessProfile({
      ...COMPLETE_DRAFT,
      sales_cycle: "   ",
    })).toBeNull();
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

  it("tracks unsaved, saving, saved, and error states from authoritative progress", () => {
    let state = createOnboardingState(COMPLETE_DRAFT, 1);
    state = onboardingReducer(state, {
      type: "update_field",
      field: "buyer_role",
      value: "C-Suite / Founders",
    });
    expect(state.saveStatus).toBe("unsaved");

    state = onboardingReducer(state, { type: "save_started" });
    expect(state.saveStatus).toBe("saving");

    state = onboardingReducer(state, {
      type: "save_succeeded",
      step: 1,
      profile: { ...COMPLETE_DRAFT, buyer_role: "C-Suite / Founders" },
    });
    expect(state.saveStatus).toBe("saved");
    expect(state.profile.buyer_role).toBe("C-Suite / Founders");

    state = onboardingReducer(state, {
      type: "save_failed",
      message: "We could not save your profile.",
    });

    expect(state.profile).toEqual({ ...COMPLETE_DRAFT, buyer_role: "C-Suite / Founders" });
    expect(state.saveStatus).toBe("error");
    expect(state.saveError).toBe("We could not save your profile.");

    state = onboardingReducer(state, { type: "save_started" });
    expect(state.profile).toEqual({ ...COMPLETE_DRAFT, buyer_role: "C-Suite / Founders" });
    expect(state.saveStatus).toBe("saving");
    expect(state.saveError).toBeNull();
  });

  it("clamps resumed progress to the three-stage flow", () => {
    expect(createOnboardingState(COMPLETE_DRAFT, 9).step).toBe(2);
    expect(onboardingReducer(createOnboardingState(), { type: "go_to_step", step: 8 }).step).toBe(2);
  });

  it("marks stage navigation unsaved so the resumed server step advances", () => {
    const advanced = onboardingReducer(createOnboardingState(COMPLETE_DRAFT), { type: "next_step" });
    expect(advanced).toMatchObject({ step: 1, saveStatus: "unsaved" });

    const returned = onboardingReducer(advanced, { type: "previous_step" });
    expect(returned).toMatchObject({ step: 0, saveStatus: "unsaved" });
  });
});
