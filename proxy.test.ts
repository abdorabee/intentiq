import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const proxySource = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");

describe("clerk middleware preview host", () => {
  it("sends unauthenticated users to this host /login, not the Account Portal", () => {
    expect(proxySource).toContain('signInUrl: LOCAL_CLERK_SIGN_IN_PATH');
    expect(proxySource).toContain("unauthenticatedUrl: clerkUnauthenticatedLoginUrl(req.nextUrl.origin)");
    expect(proxySource).not.toContain("accounts.vesperwise.com");
    expect(proxySource).toContain('"/login(.*)"');
    expect(proxySource).toContain('"/signup(.*)"');
  });
});
