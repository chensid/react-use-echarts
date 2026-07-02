import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
// Playwright browser provider — opt-in in Vite+ 0.2.x (installed via the
// @vitest/browser-playwright peer), pinned to the bundled Vitest version so the
// browser runner and Vitest core stay aligned.
import { playwright } from "vite-plus/test/browser-playwright";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}/` : "/";

// Preserve `process.env.NODE_ENV` references verbatim in the packed bundle
// instead of inlining the library's own build-time value. The dev-only console
// warnings in use-chart-core / instance-cache are guarded by
// `NODE_ENV !== "production"`; without this identity-define the pack build folds
// those guards to the build-time value (dev), baking the warnings permanently
// into the shipped bundle so consumers can neither strip them nor silence them
// in production. Keeping the token lets each consumer's bundler DCE the dev
// branches in their own production build (and keep them in dev) — the standard
// library pattern (see Vite "Building for Production › Library Mode").
//
// IMPORTANT: keep this scoped to the pack (library) entries below — do NOT
// hoist it to a top-level `define`, which would also rewrite the examples app
// (`vp dev`/`vp build`) and leave `process.env.NODE_ENV` undefined at runtime
// there. Applied uniformly to every JS-logic entry (index and preset-full) —
// not only the one that emits warnings today — so a dev warning added to any of
// them later is automatically consumer-strippable instead of silently baked in.
// themes/registry is pure preset JSON with no guarded code.
const preserveProcessEnvNodeEnv = { "process.env.NODE_ENV": "process.env.NODE_ENV" };

// https://viteplus.dev/config/
export default defineConfig({
  base,
  build: {
    outDir: "site-dist",
  },
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react", "promise", "import"],
    categories: {
      correctness: "error",
    },
    env: { builtin: true },
    ignorePatterns: ["dist", "site-dist", "coverage"],
    overrides: [
      {
        files: ["**/*.{ts,tsx}"],
        rules: {
          "@typescript-eslint/triple-slash-reference": "off",
          "react-hooks/exhaustive-deps": "warn",
          "react/only-export-components": ["error", { allowConstantExport: true }],
          // Zero-noise regression guards (0 findings at adoption): catch genuinely
          // wrong promise usage and ESM import cycles / self-imports. These do NOT
          // flag `import "echarts"` (no no-unresolved/no-extraneous), so the
          // modular-index.ts design decision is unaffected.
          "promise/valid-params": "error",
          "promise/no-new-statics": "error",
          "promise/no-return-in-finally": "error",
          "import/no-cycle": "error",
          "import/no-self-import": "error",
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
      define: preserveProcessEnvNodeEnv,
      plugins: [babel({ presets: [reactCompilerPreset()] })],
    },
    {
      entry: { "themes/registry": "src/themes/registry.ts" },
      format: ["esm"],
      dts: { build: true },
      platform: "browser",
    },
    {
      // publint/attw run once from the index entry.
      entry: { "preset-full": "src/preset-full.ts" },
      format: ["esm"],
      dts: { build: true },
      platform: "browser",
      define: preserveProcessEnvNodeEnv,
      plugins: [babel({ presets: [reactCompilerPreset()] })],
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
      // Gate against silent coverage erosion. Source is currently 100% on all
      // metrics; thresholds sit a few points below so real regressions fail CI
      // (vitest exits 1 when unmet) without flapping on minor churn.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
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
        // Default unit-test project: happy-dom + ECharts mocked.
        // Excludes browser smoke tests so they only run via the browser project.
        extends: true,
        test: {
          name: "unit",
          pool: "threads",
          globals: true,
          environment: "happy-dom",
          include: ["src/__tests__/**/*.test.{ts,tsx}"],
          exclude: ["src/__tests__/browser/**"],
        },
      },
      {
        // Browser smoke tests: real chromium via playwright provider.
        // Covers what happy-dom can't simulate — IntersectionObserver in a real
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
