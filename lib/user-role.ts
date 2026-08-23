import { z } from "zod";

import type { UserRole } from "./types";

export const EDITABLE_USER_ROLES = ["sdr", "ae", "manager"] as const;
export type EditableUserRole = (typeof EDITABLE_USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  sdr: "SDR",
  ae: "AE",
  manager: "Manager",
  admin: "Admin",
};

export const profilePatchSchema = z
  .object({
    role: z.enum(EDITABLE_USER_ROLES).optional(),
    onboarding_completed: z.literal(false).optional(),
  })
  .strict()
  .refine(
    (value) => value.role !== undefined || value.onboarding_completed !== undefined,
    { message: "At least one profile field is required" }
  );

export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export function parseProfilePatch(body: unknown) {
  return profilePatchSchema.safeParse(body);
}

export function selectableRoles(currentRole: UserRole | null | undefined): UserRole[] {
  if (currentRole === "admin") {
    return ["sdr", "ae", "manager", "admin"];
  }
  return [...EDITABLE_USER_ROLES];
}

export function onboardingResetRedirect(onboardingCompleted: boolean): "/onboarding" | null {
  return onboardingCompleted ? null : "/onboarding";
}
