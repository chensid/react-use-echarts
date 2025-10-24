import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: ["node_modules/", "src/setupTests.ts"],
    },
    testTimeout: 10000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
