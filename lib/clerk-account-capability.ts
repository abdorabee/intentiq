import "server-only";

import { z } from "zod";

import { createSupabaseAdmin } from "@/lib/supabase";

export const CLERK_LIFECYCLE_CONTRACT = "vesperwise-clerk-lifecycle-v1";

type CapabilityEnvironment = Readonly<Record<string, string | undefined>>;

const verificationSchema = z.object({
  contract_version: z.string(),
  probe_user_id: z.string(),
  update_event_id: z.string().min(1),
  update_verified_at: z.iso.datetime({ offset: true }),
  delete_event_id: z.string().min(1),
  delete_verified_at: z.iso.datetime({ offset: true }),
  activated_at: z.iso.datetime({ offset: true }),
}).strict();

export type ClerkLifecycleVerification = z.infer<typeof verificationSchema>;
type VerificationLoader = (contractVersion: string, probeUserId: string) => Promise<unknown>;

async function loadVerification(contractVersion: string, probeUserId: string): Promise<unknown> {
  const { data, error } = await createSupabaseAdmin()
    .from("clerk_lifecycle_contract_verifications")
    .select("contract_version,probe_user_id,update_event_id,update_verified_at,delete_event_id,delete_verified_at,activated_at")
    .eq("contract_version", contractVersion)
    .eq("probe_user_id", probeUserId)
    .maybeSingle();
  return error ? null : data;
}

export async function isClerkAccountManagementReady({
  environment = process.env,
  loadVerification: verificationLoader = loadVerification,
}: {
  environment?: CapabilityEnvironment;
  loadVerification?: VerificationLoader;
} = {}): Promise<boolean> {
  const probeUserId = environment.CLERK_LIFECYCLE_PROBE_USER_ID?.trim();
  const configured = environment.CLERK_USER_LIFECYCLE_SYNC_ENABLED === "true"
    && environment.CLERK_USER_LIFECYCLE_CONTRACT === CLERK_LIFECYCLE_CONTRACT
    && Boolean(environment.CLERK_WEBHOOK_SIGNING_SECRET?.trim())
    && Boolean(probeUserId);
  if (!configured || !probeUserId) return false;

  try {
    const parsed = verificationSchema.safeParse(await verificationLoader(CLERK_LIFECYCLE_CONTRACT, probeUserId));
    return parsed.success
      && parsed.data.contract_version === CLERK_LIFECYCLE_CONTRACT
      && parsed.data.probe_user_id === probeUserId;
  } catch {
    return false;
  }
}
