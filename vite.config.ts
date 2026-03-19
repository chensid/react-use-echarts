import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

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
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    dts({
      outDir: "dist",
      tsconfigPath: "./tsconfig.app.json",
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "react-use-echarts",
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
    rolldownOptions: {
      external: ["react", "react-dom", "echarts"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          echarts: "echarts",
        },
      },
    },
  },
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
