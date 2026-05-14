import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
// Use the bundled provider from vite-plus-test (vitest is aliased to it in
// package.json). Importing @vitest/browser-playwright as an external dep would
// pull a separate copy that mismatches vite-plus-test's bundled Vitest core
// version, triggering the "Running mixed versions" warning at test start.
import { playwright } from "vitest/browser/providers/playwright";

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
      entry: { core: "src/core.ts" },
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
    // Shared coverage / mock-reset config; per-project overrides only set
    // what differs (environment, include/exclude, browser settings).
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
    projects: [
      {
        // Default unit-test project: jsdom + ECharts mocked.
        // Excludes browser smoke tests so they only run via the browser project.
        extends: true,
        test: {
          name: "unit",
          pool: "threads",
          globals: true,
          environment: "jsdom",
          include: ["src/__tests__/**/*.test.{ts,tsx}"],
          exclude: ["src/__tests__/browser/**"],
        },
      },
      {
        // Browser smoke tests: real chromium via playwright provider.
        // Covers what jsdom can't simulate — IntersectionObserver in a real
        // viewport, ResizeObserver + RAF interactions, real DOM layout.
        // Smoke level: assert effects are observable, not exact frame counts.
        extends: true,
        test: {
          name: "browser",
          globals: true,
          include: ["src/__tests__/browser/**/*.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            headless: true,
          },
        },
      },
    ],
  },
});
