import "server-only";

export const CLERK_LIFECYCLE_CONTRACT = "vesperwise-clerk-lifecycle-v1";

type CapabilityEnvironment = Readonly<Record<string, string | undefined>>;

export function hasClerkLifecycleCapability(
  environment: CapabilityEnvironment = process.env,
): boolean {
  return environment.CLERK_USER_LIFECYCLE_SYNC_ENABLED === "true"
    && environment.CLERK_USER_LIFECYCLE_CONTRACT === CLERK_LIFECYCLE_CONTRACT
    && Boolean(environment.CLERK_WEBHOOK_SIGNING_SECRET?.trim());
}
