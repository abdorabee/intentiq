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

  it("accepts profiles with optional commercial fields omitted (Skip behavior)", () => {
    const minimalProfile = {
      product_category: "Sales Intelligence",
      target_industries: ["Technology"],
      company_size: "Enterprise (1000+)",
    };

    const result = profileUpdateSchema.safeParse({
      business_profile: minimalProfile,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_profile).toMatchObject(minimalProfile);
    }
  });

  it("accepts geography and tech stack chip lists", () => {
    const result = profileUpdateSchema.safeParse({
      business_profile: {
        ...VALID_PROFILE,
        geography: ["United States", "United Kingdom"],
        tech_stack_include: ["Salesforce", "Snowflake"],
        tech_stack_exclude: ["HubSpot"],
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_profile.geography).toEqual(["United States", "United Kingdom"]);
      expect(result.data.business_profile.tech_stack_include).toEqual(["Salesforce", "Snowflake"]);
      expect(result.data.business_profile.tech_stack_exclude).toEqual(["HubSpot"]);
    }
  });

  it("accepts 1-5 seed domains, lowercased, and rejects malformed ones", () => {
    const ok = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, seed_domains: ["Example.com", "sub.example.co.uk"] },
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.business_profile.seed_domains).toEqual(["example.com", "sub.example.co.uk"]);
    }

    const emptyList = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, seed_domains: [] },
    });
    expect(emptyList.success).toBe(false);

    const tooMany = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, seed_domains: ["a.com", "b.com", "c.com", "d.com", "e.com", "f.com"] },
    });
    expect(tooMany.success).toBe(false);

    const malformed = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, seed_domains: ["not a domain"] },
    });
    expect(malformed.success).toBe(false);
  });

  it("trims workspace_name and enforces its length bound", () => {
    const ok = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, workspace_name: "  Northwind Analytics  " },
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.business_profile.workspace_name).toBe("Northwind Analytics");
    }

    const tooLong = profileUpdateSchema.safeParse({
      business_profile: { ...VALID_PROFILE, workspace_name: "x".repeat(121) },
    });
    expect(tooLong.success).toBe(false);
  });
});
