import { UnrecoverableError } from "bullmq";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FirecrawlApiError,
  firecrawlRequest,
} from "./firecrawl.mjs";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Firecrawl request failure handling", () => {
  it("marks insufficient credits as unrecoverable so BullMQ does not retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(402, { success: false, error: "Insufficient credits" })
    ));

    await expect(firecrawlRequest("secret", "/map", { method: "POST" }))
      .rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("keeps rate limits retryable and exposes the provider status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(429, { success: false, error: "Rate limit exceeded" })
    ));

    const request = firecrawlRequest("secret", "/map", { method: "POST" });
    await expect(request).rejects.toMatchObject({
      name: "FirecrawlApiError",
      status: 429,
      retryable: true,
    });
    await expect(request).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  it("marks malformed requests as unrecoverable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(400, { success: false, error: "Invalid request" })
    ));

    await expect(firecrawlRequest("secret", "/batch/scrape", { method: "POST" }))
      .rejects.toBeInstanceOf(UnrecoverableError);
  });

  it("represents transient server failures as retryable provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(503, { success: false, error: "Temporarily unavailable" })
    ));

    await expect(firecrawlRequest("secret", "/batch/scrape", { method: "POST" }))
      .rejects.toEqual(expect.objectContaining({
        name: "FirecrawlApiError",
        status: 503,
        retryable: true,
      }));
  });

  it("exports the structured retryable error contract", () => {
    const error = new FirecrawlApiError("temporary", 500, true);
    expect(error).toMatchObject({
      name: "FirecrawlApiError",
      status: 500,
      retryable: true,
    });
  });
});
