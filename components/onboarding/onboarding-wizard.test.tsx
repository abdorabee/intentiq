// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const COMPLETE_PROFILE = {
  product_category: "Sales intelligence",
  target_industries: ["B2B SaaS"],
  company_size: "51-200",
  buyer_role: "VP Sales",
  sales_motion: "Outbound",
  deal_size: "$10k-$25k",
  sales_cycle: "30-60 days",
};

const harness = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  fetcher: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: harness.replace, refresh: harness.refresh }),
}));

vi.mock("@/components/vesperwise-logo", () => ({
  default: () => <span>VesperWise</span>,
}));

import OnboardingWizard from "./onboarding-wizard";

beforeEach(() => {
  harness.replace.mockReset();
  harness.refresh.mockReset();
  harness.fetcher.mockReset();
  vi.stubGlobal("fetch", harness.fetcher);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("OnboardingWizard", () => {
  it("resumes the server-authoritative current stage in a three-stage flow", () => {
    render(
      <OnboardingWizard
        initialProfile={COMPLETE_PROFILE}
        initialStep={1}
        initialActivation={false}
        initialRevision={7}
      />,
    );

    expect(screen.getByRole("heading", { name: "Buyer and sales motion" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("shows validation errors instead of advancing an incomplete first stage", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard initialProfile={null} initialStep={0} initialActivation={false} />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Choose what your company sells.")).toBeInTheDocument();
    expect(screen.getByText("Choose at least one target industry.")).toBeInTheDocument();
    expect(screen.getByText("Choose an ideal company size.")).toBeInTheDocument();
    expect(harness.fetcher).not.toHaveBeenCalled();
  });

  it("debounces valid drafts and adopts only the authoritative saved response", async () => {
    vi.useFakeTimers();
    harness.fetcher.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("/api/onboarding/progress");
      const body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        progress: {
          step: body.step,
          draft: body.draft,
          onboarding_version: 1,
          revision: body.revision,
          updated_at: "2026-08-23T18:00:00.000Z",
        },
      }));
    });
    render(
      <OnboardingWizard
        initialProfile={COMPLETE_PROFILE}
        initialStep={0}
        initialActivation={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("What do you sell?"), {
      target: { value: "Revenue intelligence" },
    });
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(harness.fetcher).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(700));
    await act(async () => Promise.resolve());

    expect(harness.fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(harness.fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({ revision: 1 });
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("offers a direct skip on stage three before an activation error", () => {
    render(
      <OnboardingWizard
        initialProfile={COMPLETE_PROFILE}
        initialStep={2}
        initialActivation={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps activation retryable when completion lacks server evidence", async () => {
    const user = userEvent.setup();
    harness.fetcher
      .mockResolvedValueOnce(new Response(JSON.stringify({
        company: "Acme",
        domain: "acme.com",
        intent_score: 82,
        score_band: "HOT",
        score_status: "complete",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: "A persisted score or watchlist account is required",
        code: "activation_required",
      }), { status: 409 }));
    render(
      <OnboardingWizard
        initialProfile={COMPLETE_PROFILE}
        initialStep={2}
        initialActivation={false}
      />,
    );

    await user.type(screen.getByLabelText("Company domain"), "acme.com");
    await user.click(screen.getByRole("button", { name: "Score account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("persisted score");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change domain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    expect(harness.replace).not.toHaveBeenCalled();
  });

  it("surfaces watchlist errors after server-confirmed activation", async () => {
    const user = userEvent.setup();
    harness.fetcher
      .mockResolvedValueOnce(new Response(JSON.stringify({
        company: "Acme",
        domain: "acme.com",
        intent_score: 82,
        score_band: "HOT",
        score_status: "complete",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        completion: {
          onboarding_completed: true,
          onboarding_completed_at: "2026-08-23T18:00:00.000Z",
          onboarding_completed_version: 1,
          activation_source: "score",
        },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: "Watchlist limit reached",
      }), { status: 403 }));
    render(
      <OnboardingWizard
        initialProfile={COMPLETE_PROFILE}
        initialStep={2}
        initialActivation={false}
      />,
    );

    await user.type(screen.getByLabelText("Company domain"), "acme.com");
    await user.click(screen.getByRole("button", { name: "Score account" }));
    expect(await screen.findByText("Acme is activated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add to watchlist" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Watchlist limit reached");
    expect(harness.replace).not.toHaveBeenCalled();
  });
});
