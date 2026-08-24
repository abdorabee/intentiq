import { describe, expect, it } from "vitest";

import {
  normalizeBusinessProfile,
  profileUpdateSchema,
} from "./business-profile";
import type { BusinessProfile } from "./types";

const VALID_PROFILE: BusinessProfile = {
  product_category: "Sales Intelligence",
  target_industries: ["Technology"],
  company_size: "Mid-Market (201-1000)",
  buyer_role: "VP / Director",
  sales_motion: "Sales-led",
  deal_size: "$25k-$100k",
  sales_cycle: "1-3 months",
};

describe("normalizeBusinessProfile", () => {
  it("treats an all-blank industry list as an incomplete ICP", () => {
    expect(normalizeBusinessProfile({
      ...VALID_PROFILE,
      target_industries: ["", "   "],
    })).toBeNull();
  });

  it("cleans blank and duplicate legacy industries when a valid one remains", () => {
    expect(normalizeBusinessProfile({
      ...VALID_PROFILE,
      product_category: "  Sales Intelligence  ",
      target_industries: [" Technology ", "", "technology"],
    })).toMatchObject({
      product_category: "Sales Intelligence",
      target_industries: ["Technology"],
    });
  });
});

describe("profileUpdateSchema", () => {
  it("rejects profile PUT payloads containing blank industries", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        ...VALID_PROFILE,
        target_industries: ["   "],
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a profile with blank skippable motion and commercial fields", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        ...VALID_PROFILE,
        buyer_role: "",
        sales_motion: "  ",
        deal_size: "",
        sales_cycle: "",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_profile).toMatchObject({
        product_category: "Sales Intelligence",
        buyer_role: "",
        sales_motion: "",
      });
    }
  });

  it("accepts and trims a complete profile PUT payload", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        ...VALID_PROFILE,
        product_category: "  Sales Intelligence ",
        target_industries: [" Technology "],
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_profile).toMatchObject({
        product_category: "Sales Intelligence",
        target_industries: ["Technology"],
      });
    }
  });
});
