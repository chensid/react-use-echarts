import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts/core";
import { __clearThemeCacheForTesting__, isBuiltinThemeRegistered } from "../../themes";
import { registerBuiltinThemes } from "../../themes/registry";

// Mock ECharts
vi.mock("echarts/core", () => ({
  registerTheme: vi.fn(),
}));

describe("themes registry", () => {
  beforeEach(() => {
    __clearThemeCacheForTesting__();
    vi.clearAllMocks();
  });

  describe("registerBuiltinThemes", () => {
    it("should register only the non-native builtin themes and be idempotent", () => {
      registerBuiltinThemes();

      // ECharts 6 provides "dark" itself and "light" maps to its "default"
      // theme, so neither is overridden with preset JSON.
      expect(echarts.registerTheme).toHaveBeenCalledWith("macarons", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledTimes(1);
      expect(isBuiltinThemeRegistered("macarons")).toBe(true);

      // Calling again should be a no-op (idempotent)
      vi.clearAllMocks();
      registerBuiltinThemes();
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });
  });
});
