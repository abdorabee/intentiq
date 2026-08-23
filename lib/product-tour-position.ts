export type TourPlacement = "top" | "right" | "bottom" | "left" | "center";

export interface RectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface SizeLike {
  width: number;
  height: number;
}

const VIEWPORT_PADDING = 16;
const TARGET_GAP = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function getTourPosition(
  target: RectLike | null,
  popover: SizeLike,
  viewport: SizeLike,
  preferred: Exclude<TourPlacement, "center">,
): { placement: TourPlacement; top: number; left: number; maxWidth: number } {
  const maxWidth = Math.max(0, Math.min(popover.width, viewport.width - VIEWPORT_PADDING * 2));
  const width = maxWidth;
  const height = Math.min(popover.height, viewport.height - VIEWPORT_PADDING * 2);

  const centered = () => ({
    placement: "center" as const,
    top: Math.round(clamp((viewport.height - height) / 2, VIEWPORT_PADDING, viewport.height - height - VIEWPORT_PADDING)),
    left: Math.round(clamp((viewport.width - width) / 2, VIEWPORT_PADDING, viewport.width - width - VIEWPORT_PADDING)),
    maxWidth,
  });

  if (!target) {
    return centered();
  }

  const fits = {
    top: target.top - TARGET_GAP - height >= VIEWPORT_PADDING,
    right: target.right + TARGET_GAP + width <= viewport.width - VIEWPORT_PADDING,
    bottom: target.bottom + TARGET_GAP + height <= viewport.height - VIEWPORT_PADDING,
    left: target.left - TARGET_GAP - width >= VIEWPORT_PADDING,
  };
  const opposite: Record<Exclude<TourPlacement, "center">, Exclude<TourPlacement, "center">> = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  };
  const order: Array<Exclude<TourPlacement, "center">> = [preferred, opposite[preferred], "bottom", "top", "right", "left"];
  const placement = order.find((candidate, index) => order.indexOf(candidate) === index && fits[candidate]);
  if (!placement) return centered();

  let top: number;
  let left: number;
  if (placement === "top") {
    top = target.top - height - TARGET_GAP;
    left = target.left + (target.width - width) / 2;
  } else if (placement === "bottom") {
    top = target.bottom + TARGET_GAP;
    left = target.left + (target.width - width) / 2;
  } else if (placement === "left") {
    top = target.top + (target.height - height) / 2;
    left = target.left - width - TARGET_GAP;
  } else {
    top = target.top + (target.height - height) / 2;
    left = target.right + TARGET_GAP;
  }

  return {
    placement,
    top: Math.round(clamp(top, VIEWPORT_PADDING, viewport.height - height - VIEWPORT_PADDING)),
    left: Math.round(clamp(left, VIEWPORT_PADDING, viewport.width - width - VIEWPORT_PADDING)),
    maxWidth,
  };
}
