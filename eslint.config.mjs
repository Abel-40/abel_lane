import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Mezgeb is a client-only app that loads from Supabase when a screen mounts and reads browser-only values
    // (sessionStorage, matchMedia) in effects. Those effects are correct; this React Compiler rule flags them all.
    files: ["src/mezgeb/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
