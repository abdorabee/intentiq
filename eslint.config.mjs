import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code's own tooling scripts (hooks, memory helpers) — not
    // application source, and intentionally written as plain CommonJS/Node
    // scripts rather than following the app's TypeScript/ESM conventions.
    ".claude/**",
  ]),
]);

export default eslintConfig;
