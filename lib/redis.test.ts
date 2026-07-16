import { describe, expect, it } from "vitest";

import { scoreEvidenceCacheKey, scoreResultCacheKey } from "./redis";

describe("scoring cache isolation", () => {
  it("isolates personalized results across users", () => {
    const first = scoreResultCacheKey("user-a", "example.com", "profile-a", "v2");
    const second = scoreResultCacheKey("user-b", "example.com", "profile-a", "v2");

    expect(first).not.toBe(second);
  });

  it("invalidates personalized results when the profile fingerprint changes", () => {
    const first = scoreResultCacheKey("user-a", "example.com", "profile-a", "v2");
    const second = scoreResultCacheKey("user-a", "example.com", "profile-b", "v2");

    expect(first).not.toBe(second);
  });

  it("keeps workspace-neutral evidence free of user identity", () => {
    const key = scoreEvidenceCacheKey("Example.COM", "signal-evidence-v1");

    expect(key).toBe("score:evidence:signal-evidence-v1:example.com");
    expect(key).not.toContain("user-a");
  });
});
