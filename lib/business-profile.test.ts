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

  it("accepts profile with skipped commercial fields (buyer_role, sales_motion, deal_size, sales_cycle)", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        product_category: "SaaS / Software",
        target_industries: ["Technology"],
        company_size: "Mid-Market (201-1000)",
        buyer_role: "",
        sales_motion: "",
        deal_size: "",
        sales_cycle: "",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_profile).toMatchObject({
        product_category: "SaaS / Software",
        target_industries: ["Technology"],
        company_size: "Mid-Market (201-1000)",
        buyer_role: "",
        sales_motion: "",
        deal_size: "",
        sales_cycle: "",
      });
    }
  });

  it("accepts profile with skipped buying motion (step 2)", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        product_category: "Consulting / Services",
        target_industries: ["Financial Services"],
        company_size: "Enterprise (1000+)",
        buyer_role: "",
        sales_motion: "",
        deal_size: "$100K+",
        sales_cycle: "3+ months",
      },
    });

    expect(result.success).toBe(true);
  });
});
