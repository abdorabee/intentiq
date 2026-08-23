import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

function appPageRoutes(directory: string, segments: string[] = []): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const nextSegments = entry.name.startsWith("(") && entry.name.endsWith(")")
        ? segments
        : [...segments, entry.name];
      return appPageRoutes(`${directory}/${entry.name}`, nextSegments);
    }
    if (entry.name !== "page.tsx") return [];
    return [segments.length === 0 ? "/" : `/${segments.join("/")}`];
  });
}

const appRoutes = new Set(appPageRoutes(fileURLToPath(new URL("..", import.meta.url))));

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
    expect(source).not.toMatch(/subprocessors page/i);
  });

  it("points every static internal legal and footer link to an existing app route", () => {
    const internalLinks = [...source.matchAll(/href(?:\s*=\s*|\s*:\s*)["'](\/[^"']*)["']/g)]
      .map((match) => match[1]);
    expect(internalLinks.length).toBeGreaterThan(0);
    for (const href of internalLinks) {
      const pathname = href?.split("#")[0] || "/";
      expect(appRoutes, `${href} must resolve to an app page`).toContain(pathname);
    }
  });
});
