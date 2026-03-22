import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let _initialized = false;

export function initLemonSqueezy() {
  if (!_initialized) {
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY!,
      onError: (error) => console.error("[lemonsqueezy] error:", error),
    });
    _initialized = true;
  }
}
