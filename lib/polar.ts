import { Polar } from "@polar-sh/sdk";

let polarClient: Polar | undefined;

// Lazy singleton — instantiated on first request so the build worker
// doesn't throw when POLAR_ACCESS_TOKEN isn't in the build environment.
export function getPolar(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    throw new Error("POLAR_ACCESS_TOKEN environment variable is not set");
  }
  if (!polarClient) {
    polarClient = new Polar({
      accessToken: token,
      server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
    });
  }
  return polarClient;
}
