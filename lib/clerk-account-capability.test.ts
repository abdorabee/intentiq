import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hasClerkLifecycleCapability } from "./clerk-account-capability";

describe("hasClerkLifecycleCapability", () => {
  it("defaults closed unless the signed lifecycle contract is explicitly complete", () => {
    expect(hasClerkLifecycleCapability({})).toBe(false);
    expect(hasClerkLifecycleCapability({
      CLERK_USER_LIFECYCLE_SYNC_ENABLED: "true",
      CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
    })).toBe(false);
  });

  it("opens only for the verified v1 contract", () => {
    expect(hasClerkLifecycleCapability({
      CLERK_USER_LIFECYCLE_SYNC_ENABLED: "true",
      CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
      CLERK_USER_LIFECYCLE_CONTRACT: "vesperwise-clerk-lifecycle-v1",
    })).toBe(true);
  });
});
