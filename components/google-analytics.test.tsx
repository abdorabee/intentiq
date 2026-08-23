// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: string }) => (
    <script data-testid={id ?? "external-script"} data-src={src}>{children}</script>
  ),
}));

import { GoogleAnalytics } from "./google-analytics";

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
});
