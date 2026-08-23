import type { TourProgress } from "@/lib/product-tour";

const AUTHORITATIVE_TOUR_PROGRESS_EVENT = "vesperwise:authoritative-tour-progress";

export function publishAuthoritativeTourProgress(progress: TourProgress) {
  window.dispatchEvent(new CustomEvent<TourProgress>(AUTHORITATIVE_TOUR_PROGRESS_EVENT, {
    detail: progress,
  }));
}

export function subscribeToAuthoritativeTourProgress(
  listener: (progress: TourProgress) => void,
) {
  const handleProgress = (event: Event) => {
    listener((event as CustomEvent<TourProgress>).detail);
  };
  window.addEventListener(AUTHORITATIVE_TOUR_PROGRESS_EVENT, handleProgress);
  return () => window.removeEventListener(AUTHORITATIVE_TOUR_PROGRESS_EVENT, handleProgress);
}
