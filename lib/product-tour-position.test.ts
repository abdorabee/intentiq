import { describe, expect, it } from "vitest";

import { getTourPosition } from "./product-tour-position";

const viewport = { width: 1200, height: 800 };
const popover = { width: 360, height: 240 };

describe("tour positioning", () => {
  it("places guidance beside the target when the preferred side fits", () => {
    expect(getTourPosition(
      { top: 200, right: 500, bottom: 300, left: 400, width: 100, height: 100 },
      popover,
      viewport,
      "right",
    )).toEqual({ placement: "right", top: 130, left: 516, maxWidth: 360 });
  });

  it("falls back to the opposite side and clamps inside the viewport", () => {
    expect(getTourPosition(
      { top: 690, right: 1180, bottom: 790, left: 1080, width: 100, height: 100 },
      popover,
      viewport,
      "right",
    )).toEqual({ placement: "left", top: 544, left: 704, maxWidth: 360 });
  });

  it("uses a viewport-safe centered fallback when a route target is unavailable", () => {
    expect(getTourPosition(null, popover, { width: 390, height: 700 }, "bottom")).toEqual({
      placement: "center",
      top: 230,
      left: 16,
      maxWidth: 358,
    });
  });

  it("centers the popover when a large target leaves no usable side", () => {
    expect(getTourPosition(
      { top: 10, right: 1190, bottom: 790, left: 10, width: 1180, height: 780 },
      popover,
      viewport,
      "bottom",
    )).toEqual({ placement: "center", top: 280, left: 420, maxWidth: 360 });
  });
});
