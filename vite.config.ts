import { defineConfig } from "vite-plus";
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  lint: {
    "plugins": [
      "oxc",
      "typescript",
      "unicorn",
      "react"
    ],
    "categories": {
      "correctness": "warn"
    },
    "env": {
      "builtin": true
    },
    "ignorePatterns": [
      "dist",
      "coverage"
    ],
    "overrides": [
      {
        "files": [
          "**/*.{ts,tsx}"
        ],
        "rules": {
          "constructor-super": "error",
          "for-direction": "error",
          "getter-return": "error",
          "no-async-promise-executor": "error",
          "no-case-declarations": "error",
          "no-class-assign": "error",
          "no-compare-neg-zero": "error",
          "no-cond-assign": "error",
          "no-const-assign": "error",
          "no-constant-binary-expression": "error",
          "no-constant-condition": "error",
          "no-control-regex": "error",
          "no-debugger": "error",
          "no-delete-var": "error",
          "no-dupe-class-members": "error",
          "no-dupe-else-if": "error",
          "no-dupe-keys": "error",
          "no-duplicate-case": "error",
          "no-empty": "error",
          "no-empty-character-class": "error",
          "no-empty-pattern": "error",
          "no-empty-static-block": "error",
          "no-ex-assign": "error",
          "no-extra-boolean-cast": "error",
          "no-fallthrough": "error",
          "no-func-assign": "error",
          "no-global-assign": "error",
          "no-import-assign": "error",
          "no-invalid-regexp": "error",
          "no-irregular-whitespace": "error",
          "no-loss-of-precision": "error",
          "no-misleading-character-class": "error",
          "no-new-native-nonconstructor": "error",
          "no-nonoctal-decimal-escape": "error",
          "no-obj-calls": "error",
          "no-prototype-builtins": "error",
          "no-redeclare": "error",
          "no-regex-spaces": "error",
          "no-self-assign": "error",
          "no-setter-return": "error",
          "no-shadow-restricted-names": "error",
          "no-sparse-arrays": "error",
          "no-this-before-super": "error",
          "no-unassigned-vars": "error",
          "no-undef": "error",
          "no-unexpected-multiline": "error",
          "no-unreachable": "error",
          "no-unsafe-finally": "error",
          "no-unsafe-negation": "error",
          "no-unsafe-optional-chaining": "error",
          "no-unused-labels": "error",
          "no-unused-private-class-members": "error",
          "no-unused-vars": "error",
          "no-useless-backreference": "error",
          "no-useless-catch": "error",
          "no-useless-escape": "error",
          "no-with": "error",
          "preserve-caught-error": "error",
          "require-yield": "error",
          "use-isnan": "error",
          "valid-typeof": "error",
          "@typescript-eslint/ban-ts-comment": "error",
          "no-array-constructor": "error",
          "@typescript-eslint/no-duplicate-enum-values": "error",
          "@typescript-eslint/no-empty-object-type": "error",
          "@typescript-eslint/no-explicit-any": "error",
          "@typescript-eslint/no-extra-non-null-assertion": "error",
          "@typescript-eslint/no-misused-new": "error",
          "@typescript-eslint/no-namespace": "error",
          "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
          "@typescript-eslint/no-require-imports": "error",
          "@typescript-eslint/no-this-alias": "error",
          "@typescript-eslint/no-unnecessary-type-constraint": "error",
          "@typescript-eslint/no-unsafe-declaration-merging": "error",
          "@typescript-eslint/no-unsafe-function-type": "error",
          "no-unused-expressions": "error",
          "@typescript-eslint/no-wrapper-object-types": "error",
          "@typescript-eslint/prefer-as-const": "error",
          "@typescript-eslint/prefer-namespace-keyword": "error",
          "@typescript-eslint/triple-slash-reference": "off",
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
          "react/only-export-components": [
            "error",
            {
              "allowConstantExport": true
            }
          ]
        },
        "env": {
          "es2020": true,
          "browser": true
        }
      },
      {
        "files": [
          "src/__tests__/**/*.{ts,tsx}"
        ],
        "rules": {
          "@typescript-eslint/unbound-method": "off"
        },
        "env": {
          "es2020": true,
          "browser": true,
          "node": true
        }
      }
    ],
    "options": {
      "typeAware": true,
      "typeCheck": true
    }
  },
  staged: {
    "*.{ts,tsx}": [
      "vp lint"
    ]
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
