import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const wizardSource = readFileSync(new URL("./onboarding-wizard.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/onboarding/page.tsx", import.meta.url), "utf8");

describe("onboarding wizard contracts", () => {
  it("uses dashboard tokens instead of isolated glow-orb chrome", () => {
    expect(wizardSource).not.toMatch(/blur-\[120px\]/);
    expect(wizardSource).not.toMatch(/glow/);
    expect(wizardSource).toMatch(/btn-primary/);
    expect(wizardSource).toMatch(/tb-btn/);
    expect(wizardSource).toMatch(/settings-choice/);
    expect(wizardSource).toMatch(/page-title/);
  });

  it("persists progress and finishes on Score, not the metrics dashboard", () => {
    expect(wizardSource).toMatch(/\/api\/user\/preferences/);
    expect(wizardSource).toMatch(/\/api\/v1\/score/);
    expect(wizardSource).toMatch(/getOnboardingCompleteDestination/);
    expect(wizardSource).toMatch(/runFirstScoreAttempt/);
    expect(wizardSource).not.toMatch(/replace\(["']\/dashboard["']\)/);
    expect(wizardSource).toMatch(/Skip for now/);
  });

  it("resumes from stored step and draft on the onboarding page", () => {
    expect(pageSource).toMatch(/resolveOnboardingResume/);
    expect(pageSource).toMatch(/getOnboardingRedirect/);
    expect(pageSource).toMatch(/initialStep/);
  });
});
