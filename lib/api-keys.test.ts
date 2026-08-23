import { describe, expect, it } from "vitest";

import {
  API_KEY_LIMITS,
  apiKeyLabelSchema,
  publicApiKeyRecord,
} from "./api-keys";

describe("API key product contract", () => {
  it("trims strict human labels and rejects missing or oversized labels", () => {
    expect(apiKeyLabelSchema.parse("  Production sync  ")).toBe("Production sync");
    expect(apiKeyLabelSchema.safeParse("").success).toBe(false);
    expect(apiKeyLabelSchema.safeParse("x".repeat(49)).success).toBe(false);
  });

  it("defines a positive active-key limit for every current billing plan", () => {
    expect(API_KEY_LIMITS).toEqual({
      free: 1,
      starter: 2,
      growth: 5,
      pro: 10,
      agency: 25,
    });
  });

  it("never projects key hashes or owner IDs to the browser", () => {
    expect(publicApiKeyRecord({
      id: "key_1",
      user_id: "user_123",
      key_hash: "secret-hash",
      label: "Production",
      last_used: null,
      is_active: true,
      created_at: "2026-08-23T12:00:00.000Z",
    })).toEqual({
      id: "key_1",
      label: "Production",
      last_used: null,
      is_active: true,
      created_at: "2026-08-23T12:00:00.000Z",
    });
  });
});
