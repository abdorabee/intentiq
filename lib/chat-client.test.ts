import { describe, expect, it } from "vitest";

import { extractDomain } from "./chat-client";

describe("extractDomain", () => {
  it("accepts a bare hostname", () => {
    expect(extractDomain("stripe.com")).toBe("stripe.com");
  });

  it("strips protocol and www", () => {
    expect(extractDomain("https://www.Linear.app/careers")).toBe("linear.app");
  });

  it("rejects questions and empty input", () => {
    expect(extractDomain("why is this cold?")).toBeNull();
    expect(extractDomain("")).toBeNull();
    expect(extractDomain("localhost")).toBeNull();
  });
});
