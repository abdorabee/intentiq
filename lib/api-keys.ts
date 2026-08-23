import { z } from "zod";

import type { DbApiKey, DbUser } from "@/lib/types";

export const API_KEY_LIMITS: Record<DbUser["plan"], number> = {
  free: 1,
  starter: 2,
  growth: 5,
  pro: 10,
  agency: 25,
};

export const apiKeyLabelSchema = z.string().trim().min(1).max(48);
export const apiKeyIdSchema = z.uuid();

export const apiKeyRecordSchema = z.strictObject({
  id: z.string().min(1),
  user_id: z.string().min(1),
  label: apiKeyLabelSchema,
  last_used: z.iso.datetime({ offset: true }).nullable(),
  is_active: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
});

export type ApiKeyRecord = z.infer<typeof apiKeyRecordSchema>;
export type PublicApiKeyRecord = Omit<ApiKeyRecord, "user_id">;

export function isPlan(value: unknown): value is DbUser["plan"] {
  return typeof value === "string" && value in API_KEY_LIMITS;
}

export function publicApiKeyRecord(
  row: Pick<DbApiKey, "id" | "user_id" | "label" | "last_used" | "is_active" | "created_at"> &
    Partial<Pick<DbApiKey, "key_hash">>,
): PublicApiKeyRecord {
  return {
    id: row.id,
    label: row.label,
    last_used: row.last_used,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}
