const PRODUCTION_ORIGIN = "https://www.vesperwise.com";
const PREVIEW_WILDCARD = "https://*.abdorabees-projects.vercel.app";
const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

export const LOCAL_CLERK_SIGN_IN_PATH = "/login";
export const LOCAL_CLERK_SIGN_UP_PATH = "/signup";

export function clerkUnauthenticatedLoginUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}${LOCAL_CLERK_SIGN_IN_PATH}`;
}

export function clerkAllowedRedirectOrigins(
  env: NodeJS.Dict<string> = process.env,
): string[] {
  const origins = new Set<string>([
    PRODUCTION_ORIGIN,
    PREVIEW_WILDCARD,
    ...LOCAL_ORIGINS,
  ]);

  if (env.VERCEL_URL) {
    origins.add(`https://${env.VERCEL_URL.replace(/^https?:\/\//, "")}`);
  }
  if (env.VERCEL_BRANCH_URL) {
    origins.add(`https://${env.VERCEL_BRANCH_URL.replace(/^https?:\/\//, "")}`);
  }

  return [...origins];
}
