import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CLERK_LIFECYCLE_CONTRACT,
  isClerkAccountManagementReady,
} from "./clerk-account-capability";

const CONFIGURED_ENVIRONMENT = {
  CLERK_USER_LIFECYCLE_SYNC_ENABLED: "true",
  CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
  CLERK_USER_LIFECYCLE_CONTRACT: CLERK_LIFECYCLE_CONTRACT,
  CLERK_LIFECYCLE_PROBE_USER_ID: "user_probe",
};

describe("isClerkAccountManagementReady", () => {
  it("defaults closed unless the signed lifecycle configuration is explicitly complete", async () => {
    await expect(isClerkAccountManagementReady({ environment: {}, loadVerification: vi.fn() })).resolves.toBe(false);
    await expect(isClerkAccountManagementReady({ environment: {
      CLERK_USER_LIFECYCLE_SYNC_ENABLED: "true",
      CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
    }, loadVerification: vi.fn() })).resolves.toBe(false);
  });

  it("does not treat environment strings as lifecycle proof", async () => {
    const loadVerification = vi.fn(async () => null);
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification,
    })).resolves.toBe(false);
    expect(loadVerification).toHaveBeenCalledWith(CLERK_LIFECYCLE_CONTRACT, "user_probe");
  });

  it("opens only for completed database evidence for the configured contract and probe user", async () => {
    const verified = {
      contract_version: CLERK_LIFECYCLE_CONTRACT,
      probe_user_id: "user_probe",
      update_event_id: "evt_update",
      update_verified_at: "2026-08-23T12:00:00.000Z",
      delete_event_id: "evt_delete",
      delete_verified_at: "2026-08-23T12:01:00.000Z",
      activated_at: "2026-08-23T12:01:00.000Z",
    };
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => verified,
    })).resolves.toBe(true);
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => ({ ...verified, probe_user_id: "user_foreign" }),
    })).resolves.toBe(false);
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => ({ ...verified, delete_verified_at: null, activated_at: null }),
    })).resolves.toBe(false);
  });
});
