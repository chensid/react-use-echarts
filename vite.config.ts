import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}/` : "/";

// https://viteplus.dev/config/
export default defineConfig({
  base,
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: {
      correctness: "error",
    },
    env: { builtin: true },
    ignorePatterns: ["dist", "coverage"],
    overrides: [
      {
        files: ["**/*.{ts,tsx}"],
        rules: {
          "@typescript-eslint/triple-slash-reference": "off",
          "react-hooks/exhaustive-deps": "warn",
          "react/only-export-components": ["error", { allowConstantExport: true }],
        },
        env: { es2020: true, browser: true },
      },
      {
        files: ["src/__tests__/**/*.{ts,tsx}"],
        rules: {
          "@typescript-eslint/unbound-method": "off",
        },
        env: { es2020: true, browser: true, node: true },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  staged: {
    "*": "vp check --fix",
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  pack: [
    {
      entry: "src/index.ts",
      format: ["esm"],
      dts: { build: true },
      publint: true,
      attw: { profile: "esm-only" },
      platform: "browser",
      plugins: [babel({ presets: [reactCompilerPreset()] })],
    },
    {
      entry: { "themes/registry": "src/themes/registry.ts" },
      format: ["esm"],
      dts: { build: true },
      platform: "browser",
    },
  ],
  server: {
    port: 3000,
  },
  test: {
    pool: "threads",
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*"],
      exclude: [
        "node_modules/",
        "src/__tests__/**",
        "src/vite-env.d.ts",
        "src/types/**",
        "src/index.ts",
      ],
    },
    testTimeout: 10000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
