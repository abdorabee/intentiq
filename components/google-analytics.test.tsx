// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: string }) => (
    <script data-testid={id ?? "external-script"} data-src={src}>{children}</script>
  ),
}));

import { ANALYTICS_CONSENT_EVENT, GoogleAnalytics } from "./google-analytics";

afterEach(cleanup);

describe("GoogleAnalytics consent gate", () => {
  it("does not load Google Analytics when persisted consent is disabled", () => {
    render(<GoogleAnalytics initialEnabled={false} />);
    expect(screen.queryByTestId("external-script")).not.toBeInTheDocument();
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("loads GA only when persisted consent is enabled", () => {
    render(<GoogleAnalytics initialEnabled />);
    expect(screen.getByTestId("external-script")).toHaveAttribute(
      "data-src",
      "https://www.googletagmanager.com/gtag/js?id=G-TQKL17V4G9",
    );
    expect(screen.getByTestId("google-analytics")).toHaveTextContent("G-TQKL17V4G9");
  });

  it("sends denied then granted on persisted opt-out and opt-in without duplicating scripts", () => {
    const gtag = vi.fn();
    Object.assign(window, { gtag });
    render(<GoogleAnalytics initialEnabled />);

    act(() => window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: false })));
    expect(gtag).toHaveBeenLastCalledWith("consent", "update", { analytics_storage: "denied" });
    expect(screen.queryByTestId("external-script")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: true })));
    expect(gtag).toHaveBeenLastCalledWith("consent", "update", { analytics_storage: "granted" });
    expect(screen.getAllByTestId("external-script")).toHaveLength(1);

    act(() => window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: true })));
    expect(screen.getAllByTestId("external-script")).toHaveLength(1);
  });

  it("queues granted consent when opting in before GA has created gtag", () => {
    delete (window as typeof window & { gtag?: unknown }).gtag;
    delete (window as typeof window & { dataLayer?: unknown }).dataLayer;
    render(<GoogleAnalytics initialEnabled={false} />);
    act(() => window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: true })));
    const analyticsWindow = window as typeof window & { dataLayer?: unknown[][] };
    expect(analyticsWindow.dataLayer).toContainEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
});
