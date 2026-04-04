import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";

// https://viteplus.dev/config/
export default defineConfig({
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
      format: ["esm", "umd"],
      dts: { build: true },
      platform: "browser",
      globalName: "react-use-echarts",
      outputOptions: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
          "react/compiler-runtime": "ReactCompilerRuntime",
          echarts: "echarts",
        },
      },
      plugins: [babel({ presets: [reactCompilerPreset()] })],
    },
    {
      entry: { "themes/registry": "src/themes/registry.ts" },
      format: ["esm"],
      dts: { build: true },
      platform: "browser",
      outputOptions: {
        globals: {
          echarts: "echarts",
        },
      },
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
      exclude: ["node_modules/", "src/__tests__/**"],
    },
    testTimeout: 10000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
