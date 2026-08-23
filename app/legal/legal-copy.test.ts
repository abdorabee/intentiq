import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sourceFiles = [
  "./dpa/dpa-view.tsx",
  "./security/security-view.tsx",
  "../privacy/privacy-view.tsx",
  "../terms/terms-view.tsx",
  "../contact/contact-view.tsx",
  "../docs/docs-view.tsx",
  "../about/about-view.tsx",
  "../../components/site-footer.tsx",
  "../../components/landing/LandingPage.tsx",
];

const source = sourceFiles
  .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
  .join("\n");

describe("published legal and navigation copy", () => {
  it("does not ship placeholder navigation or resources", () => {
    expect(source).not.toContain('href="#"');
    expect(source).not.toContain("href='#'");
    expect(source).not.toMatch(/href:\s*["']\/?#["']/);
    expect(source).not.toContain(': "#"');
  });

  it("does not promise unsupported export, diagrams, mappings, or remote cascade proof", () => {
    expect(source).not.toMatch(/JSON export available in.product/i);
    expect(source).not.toMatch(/diagrams and control mappings/i);
    expect(source).not.toMatch(/invokes verified foreign.key cascades/i);
    expect(source).not.toMatch(/99\.97% uptime|SLAs in effect|8h SLA/i);
  });
});
