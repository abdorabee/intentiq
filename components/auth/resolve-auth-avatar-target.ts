export type AuthAvatarFocus = "email" | "name" | "code" | "password" | null;

export type AuthAvatarInput = {
  focus: AuthAvatarFocus;
  value: string;
  passwordVisible: boolean;
  hasError: boolean;
  success: boolean;
};

export type StrobiExpression =
  | "curious-left"
  | "attentive-left"
  | "neutral"
  | "far-right-glance"
  | "playful-right"
  | "eyes-closed"
  | "downward-gaze"
  | "uneasy-left"
  | "joyful-wide";

export type StrobiAnimation = "idle" | "happy";

export type AuthAvatarTarget =
  | { kind: "animation"; animation: StrobiAnimation }
  | { kind: "expression"; expression: StrobiExpression };

export function watchExpressionForLength(value: string): StrobiExpression {
  const length = value.length;
  if (length === 0) return "curious-left";
  if (length <= 6) return "attentive-left";
  if (length <= 14) return "neutral";
  if (length <= 24) return "far-right-glance";
  return "playful-right";
}

export function resolveAuthAvatarTarget(input: AuthAvatarInput): AuthAvatarTarget {
  if (input.success) {
    return { kind: "animation", animation: "happy" };
  }

  if (input.hasError) {
    return { kind: "expression", expression: "uneasy-left" };
  }

  if (input.focus === "password") {
    return {
      kind: "expression",
      expression: input.passwordVisible ? "downward-gaze" : "eyes-closed",
    };
  }

  if (input.focus === "email" || input.focus === "name" || input.focus === "code") {
    return {
      kind: "expression",
      expression: watchExpressionForLength(input.value),
    };
  }

  return { kind: "animation", animation: "idle" };
}
