import { describe, expect, it } from "vitest";

import {
  resolveAuthAvatarTarget,
  watchExpressionForLength,
} from "./resolve-auth-avatar-target";

describe("watchExpressionForLength", () => {
  it("looks left when the field is empty", () => {
    expect(watchExpressionForLength("")).toBe("curious-left");
  });

  it("tracks typing from left to right", () => {
    expect(watchExpressionForLength("ab")).toBe("attentive-left");
    expect(watchExpressionForLength("user@domain")).toBe("neutral");
    expect(watchExpressionForLength("user@example.com")).toBe("far-right-glance");
    expect(watchExpressionForLength("very.long.address@example.com")).toBe("playful-right");
  });
});

describe("resolveAuthAvatarTarget", () => {
  const idle = {
    focus: null,
    value: "",
    passwordVisible: false,
    hasError: false,
    success: false,
  } as const;

  it("idles when nothing is focused", () => {
    expect(resolveAuthAvatarTarget({ ...idle })).toEqual({
      kind: "animation",
      animation: "idle",
    });
  });

  it("watches email text", () => {
    expect(
      resolveAuthAvatarTarget({
        ...idle,
        focus: "email",
        value: "hi",
      })
    ).toEqual({ kind: "expression", expression: "attentive-left" });
  });

  it("covers its eyes on a hidden password", () => {
    expect(
      resolveAuthAvatarTarget({
        ...idle,
        focus: "password",
        passwordVisible: false,
      })
    ).toEqual({ kind: "expression", expression: "eyes-closed" });
  });

  it("peeks when the password is visible", () => {
    expect(
      resolveAuthAvatarTarget({
        ...idle,
        focus: "password",
        passwordVisible: true,
      })
    ).toEqual({ kind: "expression", expression: "downward-gaze" });
  });

  it("shows unease on error over field focus", () => {
    expect(
      resolveAuthAvatarTarget({
        ...idle,
        focus: "email",
        value: "bad",
        hasError: true,
      })
    ).toEqual({ kind: "expression", expression: "uneasy-left" });
  });

  it("celebrates success over errors", () => {
    expect(
      resolveAuthAvatarTarget({
        ...idle,
        hasError: true,
        success: true,
      })
    ).toEqual({ kind: "animation", animation: "happy" });
  });
});
