import { describe, expect, it } from "vitest";
import {
  WEB_ENRICHMENT_SCHEMA_VERSION,
  WEB_ENRICHMENT_SIGNAL_KEYS,
  WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS,
} from "./web-enrichment-queue";
import {
  DEFAULT_SIGNAL_TYPES,
  SCHEMA_VERSION,
  SUPPORTED_SIGNAL_TYPES,
} from "../workers/web-enrichment/contract.mjs";

describe("web enrichment app/worker contract", () => {
  it("keeps schema and signal lists in parity across runtimes", () => {
    expect(SCHEMA_VERSION).toBe(WEB_ENRICHMENT_SCHEMA_VERSION);
    expect(SUPPORTED_SIGNAL_TYPES).toEqual([...WEB_ENRICHMENT_SUPPORTED_SIGNAL_KEYS]);
    expect(DEFAULT_SIGNAL_TYPES).toEqual([...WEB_ENRICHMENT_SIGNAL_KEYS]);
  });
});
