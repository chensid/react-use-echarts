import { defineConfig, type Plugin } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
// Playwright browser provider — installed via the
// @vitest/browser-playwright peer, pinned to the bundled Vitest version so the
// browser runner and Vitest core stay aligned.
import { playwright } from "vite-plus/test/browser-playwright";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}/` : "/";

// Two builds of the main entry, neither of which needs a `process` global, so
// raw ESM loads without a bundler (the Lit / Solid pattern):
//
// - Production (`dist/index.js`, the `default` export condition): NODE_ENV is
//   defined as "production", so Rolldown folds the dev-only guards in
//   use-chart-core / instance-cache and drops the warnings entirely.
// - Development (`dist/development/index.js`, the `development` condition that
//   Vite, webpack, Rspack, Next.js and Vitest pick in dev): NODE_ENV becomes
//   the guarded expression below. It reads "test" only when a real `process`
//   says so (consumers' Node-based test runs stay quiet, as before) and is
//   "development" otherwise; `typeof process` short-circuits before any
//   `process.env` access, and consumer bundlers still replace the inner
//   `process.env.NODE_ENV` as usual.
//
// IMPORTANT: keep these scoped to the pack (library) entries below — do NOT
// hoist them to a top-level `define`, which would also rewrite the examples app
// (`vp dev`/`vp build`). Every default-condition entry gets the production
// define, not only the one that emits warnings today, so a dev warning added to
// any of them later is stripped instead of shipping a raw `process` reference;
// `forbidRawProcess` fails the pack if one slips through anyway.
const productionNodeEnv = { "process.env.NODE_ENV": JSON.stringify("production") };
const developmentNodeEnvExpression =
  '(typeof process !== "undefined" && process.env.NODE_ENV === "test" ? "test" : "development")';
const developmentNodeEnv = { "process.env.NODE_ENV": developmentNodeEnvExpression };

// Fail the pack if an emitted entry mentions `process` anywhere except inside
// `allowed` (the development build's guarded expression), so neither build can
// regress into throwing `ReferenceError: process is not defined` without a
// bundler.
function forbidRawProcess(allowed?: string): Plugin {
  return {
    name: "forbid-raw-process",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.fileName.endsWith(".js")) continue;
        const code = allowed ? chunk.code.replaceAll(allowed, "") : chunk.code;
        if (/\bprocess\b/.test(code)) {
          this.error(`${chunk.fileName} references \`process\` outside the allowed guard`);
        }
      }
    },
  };
}

// Ship JS without JSDoc: editors read API docs from the emitted `.d.ts`, so
// JSDoc in `dist/*.js` only inflated the bundle (about half its gzip size) and
// made size-limit track comment volume instead of code. Rolldown already drops
// plain `//` and `/* */` comments; legal and `@__PURE__`-style annotations are
// kept, the latter because consumer bundlers rely on them for tree-shaking.
const stripDocComments = { comments: { legal: true, annotation: true, jsdoc: false } };

// Every library entry starts with "use client" so RSC frameworks treat it as
// client code. Rolldown only warns that a module-level directive "may not be
// preserved" (`vp pack` prints it for every entry, though each one keeps the
// directive today), so fail the pack — and with it CI and `prepublishOnly` — if
// an emitted entry ever loses it.
const requireUseClient: Plugin = {
  name: "require-use-client",
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (
        chunk.type === "chunk" &&
        chunk.isEntry &&
        chunk.fileName.endsWith(".js") &&
        !chunk.code.startsWith('"use client";')
      ) {
        this.error(`${chunk.fileName} lost its "use client" directive`);
      }
    }
  },
};

// React Compiler via Babel, shared by the dev/build plugins and the pack entries.
// @rolldown/plugin-babel types its result against the standalone `rolldown`
// peer, while `plugins` / `pack[].plugins` expect the copy bundled in
// @voidzero-dev/vite-plus-core. Since Vite+ 1.2.0 both are rolldown 1.2.13, and
// TypeScript overflows (TS2321, then TS2322 against `TsdownPluginOption`) when
// it compares the two identical recursive `Plugin` types — the same class as
// voidzero-dev/vite-plus#2269. Asserting to Vite+'s own `Plugin` keeps every
// comparison on one copy. Drop the assertion once the plugin types against
// Vite+'s rolldown or Vite+ dedupes the peer.
const reactCompiler = () => babel({ presets: [reactCompilerPreset()] }) as Promise<Plugin>;

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
          // Test harnesses publish the hook result to an outer ref during render
          // (`chartRef.current = chart`) so the test body can drive the imperative
          // API. Deliberate in a harness, so keep this oxlint 1.79 rule to src/.
          "react/refs": "off",
        },
        env: { es2020: true, browser: true, node: true },
      },
      {
        // The showcase app demonstrates patterns these two oxlint 1.79 rules
        // flag by design: DynamicChart holds the option in a ref to exercise the
        // stable-option-reference path, and Layout / ExportStream reset state
        // from an effect on route and theme changes. Library source under src/
        // keeps both rules at correctness level.
        files: ["examples/**/*.{ts,tsx}"],
        rules: {
          "react/refs": "off",
          "react/set-state-in-effect": "off",
        },
        env: { es2020: true, browser: true },
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
  plugins: [react(), reactCompiler()],
  pack: [
    {
      // tsdown 0.23's default: keep external subpath imports (`echarts/core`)
      // as written. Stated explicitly in every entry because `vp migrate`
      // inserts the pre-0.23 `true` wherever the key is absent.
      deps: { resolveDepSubpath: false },
      entry: "src/index.ts",
      format: ["esm"],
      // TypeScript 7's native declaration compiler consumes a single project
      // config, so pack must target the leaf library project, not the solution root.
      tsconfig: "tsconfig.lib.json",
      dts: { generator: "tsgo" },
      publint: true,
      // Also tsdown 0.23's default, kept explicit for the same reason: a bare
      // `attw: true` gets the pre-0.23 `strict` profile from `vp migrate`, whose
      // node10/CJS checks flag every entry of this ESM-only package.
      attw: { profile: "esm-only" },
      platform: "browser",
      outputOptions: stripDocComments,
      define: productionNodeEnv,
      plugins: [reactCompiler(), requireUseClient, forbidRawProcess()],
    },
    {
      deps: { resolveDepSubpath: false },
      entry: { "themes/registry": "src/themes/registry.ts" },
      format: ["esm"],
      tsconfig: "tsconfig.lib.json",
      dts: { generator: "tsgo" },
      platform: "browser",
      outputOptions: stripDocComments,
      define: productionNodeEnv,
      plugins: [requireUseClient, forbidRawProcess()],
    },
    {
      deps: { resolveDepSubpath: false },
      // publint/attw run once from the index entry.
      entry: { "preset-full": "src/preset-full.ts" },
      format: ["esm"],
      tsconfig: "tsconfig.lib.json",
      dts: { generator: "tsgo" },
      platform: "browser",
      outputOptions: stripDocComments,
      define: productionNodeEnv,
      plugins: [reactCompiler(), requireUseClient, forbidRawProcess()],
    },
    {
      deps: { resolveDepSubpath: false },
      // Development build of the main entry, served through the `development`
      // export condition. Types come from the production entry's `.d.ts`
      // (`exports["."].types`), so this entry emits none.
      entry: { "development/index": "src/index.ts" },
      format: ["esm"],
      tsconfig: "tsconfig.lib.json",
      dts: false,
      platform: "browser",
      outputOptions: stripDocComments,
      define: developmentNodeEnv,
      plugins: [reactCompiler(), requireUseClient, forbidRawProcess(developmentNodeEnvExpression)],
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
      include: ["src/**/*.{ts,tsx,json}"],
      exclude: ["node_modules/", "src/__tests__/**", "src/types/**"],
    },
    testTimeout: 10000,
    mockReset: true,
    restoreMocks: true,
    projects: [
      {
        // Default unit-test project: happy-dom + ECharts mocked.
        // Excludes browser smoke tests so they only run via the browser project.
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
