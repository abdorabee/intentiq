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

const VERIFIED_EVIDENCE = {
  contract_version: CLERK_LIFECYCLE_CONTRACT,
  probe_user_id: "user_probe",
  update_event_id: "evt_update",
  update_verified_at: "2026-08-23T12:00:00+00:00",
  delete_event_id: "evt_delete",
  delete_verified_at: "2026-08-23T12:01:00+00:00",
  activated_at: "2026-08-23T12:01:00+00:00",
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

  it("opens for completed PostgREST timestamptz evidence with explicit offsets", async () => {
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => VERIFIED_EVIDENCE,
    })).resolves.toBe(true);
  });

  it.each(["update_verified_at", "delete_verified_at", "activated_at"] as const)(
    "stays closed when %s is not an offset-aware ISO timestamp",
    async (field) => {
      await expect(isClerkAccountManagementReady({
        environment: CONFIGURED_ENVIRONMENT,
        loadVerification: async () => ({ ...VERIFIED_EVIDENCE, [field]: "2026-08-23 12:00:00+00" }),
      })).resolves.toBe(false);
    },
  );

  it("stays closed for missing or incomplete activation evidence", async () => {
    const missingDeleteTimestamp: Record<string, unknown> = { ...VERIFIED_EVIDENCE };
    delete missingDeleteTimestamp.delete_verified_at;
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => missingDeleteTimestamp,
    })).resolves.toBe(false);
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => ({ ...VERIFIED_EVIDENCE, delete_verified_at: null, activated_at: null }),
    })).resolves.toBe(false);
  });

  it("stays closed for evidence belonging to a foreign probe user", async () => {
    await expect(isClerkAccountManagementReady({
      environment: CONFIGURED_ENVIRONMENT,
      loadVerification: async () => ({ ...VERIFIED_EVIDENCE, probe_user_id: "user_foreign" }),
    })).resolves.toBe(false);
  });
});
