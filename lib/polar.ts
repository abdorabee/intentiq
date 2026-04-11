import { Polar } from "@polar-sh/sdk";

// Singleton Polar client — imported wherever the SDK is needed.
// Set POLAR_SERVER=production in env to switch to live mode.
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});
