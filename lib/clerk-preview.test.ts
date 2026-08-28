import { describe, expect, it } from "vitest";

import {
  clerkAllowedRedirectOrigins,
  clerkUnauthenticatedLoginUrl,
  LOCAL_CLERK_SIGN_IN_PATH,
} from "./clerk-preview";

describe("clerkUnauthenticatedLoginUrl", () => {
  it("keeps unauthenticated users on the request host login path", () => {
    expect(
      clerkUnauthenticatedLoginUrl(
        "https://intentiq-git-cursor-saas-product-pol-b7b279-abdorabees-projects.vercel.app",
      ),
    ).toBe(
      "https://intentiq-git-cursor-saas-product-pol-b7b279-abdorabees-projects.vercel.app/login",
    );
    expect(LOCAL_CLERK_SIGN_IN_PATH).toBe("/login");
    expect(clerkUnauthenticatedLoginUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/login",
    );
  });
});

describe("clerkAllowedRedirectOrigins", () => {
  it("always includes production, the Vercel project wildcard, and local dev origins", () => {
    const origins = clerkAllowedRedirectOrigins({});
    expect(origins).toContain("https://www.vesperwise.com");
    expect(origins).toContain("https://*.abdorabees-projects.vercel.app");
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3000");
  });

  it("adds the current Vercel preview and branch hosts when set", () => {
    const origins = clerkAllowedRedirectOrigins({
      VERCEL_URL: "intentiq-abc.vercel.app",
      VERCEL_BRANCH_URL: "intentiq-git-cursor-saas-product-pol-b7b279-abdorabees-projects.vercel.app",
    });
    expect(origins).toContain("https://intentiq-abc.vercel.app");
    expect(origins).toContain(
      "https://intentiq-git-cursor-saas-product-pol-b7b279-abdorabees-projects.vercel.app",
    );
  });
});
