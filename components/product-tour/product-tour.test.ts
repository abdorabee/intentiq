import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tourSource = readFileSync(new URL("./product-tour.tsx", import.meta.url), "utf8");
const logicSource = readFileSync(new URL("../../lib/product-tour.ts", import.meta.url), "utf8");
const scoreSource = readFileSync(
  new URL("../../app/(dashboard)/score/score-view.tsx", import.meta.url),
  "utf8"
);
const navSource = readFileSync(new URL("../dashboard/nav.tsx", import.meta.url), "utf8");
const topbarSource = readFileSync(
  new URL("../dashboard/dashboard-topbar.tsx", import.meta.url),
  "utf8"
);
const shellSource = readFileSync(
  new URL("../dashboard/dashboard-shell.tsx", import.meta.url),
  "utf8"
);
const experienceSource = readFileSync(
  new URL("../../app/(dashboard)/settings/experience/page.tsx", import.meta.url),
  "utf8"
);
const cssSource = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../../package.json", import.meta.url), "utf8");

describe("product tour overlay contracts", () => {
  it("ships a custom overlay with Skip, Next, Back, Finish, Escape, and a focus trap", () => {
    expect(tourSource).toContain("Skip");
    expect(tourSource).toContain("Next");
    expect(tourSource).toContain("Back");
    expect(tourSource).toContain("Finish");
    expect(tourSource).toContain("isTourDismissKey");
    expect(tourSource).toContain("nextFocusIndex");
    expect(tourSource).toContain('role="dialog"');
    expect(tourSource).toContain('aria-modal="true"');
    expect(tourSource).toContain("productTourCompletionPatch");
    expect(tourSource).toContain("/api/user/preferences");
    expect(tourSource).toContain("shouldStartProductTour");
    expect(tourSource).toContain("PRODUCT_TOUR_RESTART_EVENT");
    expect(tourSource).not.toMatch(/joyride|intro\.js|shepherd|driver\.js|react-joyride/i);
  });

  it("marks Score, composer, result, Intent Hub, and Settings targets", () => {
    expect(scoreSource).toContain('data-tour="score-workspace"');
    expect(scoreSource).toContain('data-tour="score-composer"');
    expect(scoreSource).toContain('"score-result"');
    expect(navSource).toContain("nav-intent-hub");
    expect(navSource).toContain("nav-settings");
    expect(topbarSource).toContain('data-tour="nav-menu"');
    expect(shellSource).toContain("ProductTour");
  });

  it("restarts from Settings by clearing the flag and routing to Score", () => {
    expect(experienceSource).toContain("productTourRestartPatch");
    expect(experienceSource).toContain("productTourRestartHref");
    expect(experienceSource).toContain("PRODUCT_TOUR_RESTART_EVENT");
    expect(experienceSource).toContain("router.push");
    expect(logicSource).toContain('return isScoreWorkspacePath(pathname) ? null : "/score"');
  });

  it("uses a subtle token overlay and honors reduced motion", () => {
    expect(cssSource).toContain(".product-tour-spotlight");
    expect(cssSource).toContain(".product-tour-card");
    expect(cssSource).toContain("prefers-reduced-motion");
    expect(cssSource).not.toMatch(/product-tour[\s\S]{0,400}confetti/i);
    expect(cssSource).not.toMatch(/product-tour[\s\S]{0,400}glow-orb/i);
    expect(existsSync(new URL("./product-tour.tsx", import.meta.url))).toBe(true);
  });

  it("does not add a third-party tour library", () => {
    expect(packageSource).not.toMatch(/joyride|intro\.js|shepherd|driver\.js/i);
  });
});
