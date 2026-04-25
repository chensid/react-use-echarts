import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts";
import { clearThemeCache, isBuiltinThemeRegistered } from "../../themes";
import { registerBuiltinThemes } from "../../themes/registry";

// Mock ECharts
vi.mock("echarts", () => ({
  registerTheme: vi.fn(),
}));

describe("themes registry", () => {
  beforeEach(() => {
    clearThemeCache();
    vi.clearAllMocks();
  });

  describe("registerBuiltinThemes", () => {
    it("should register all builtin themes and be idempotent on subsequent calls", () => {
      registerBuiltinThemes();

      expect(echarts.registerTheme).toHaveBeenCalledWith("light", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("dark", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("macarons", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledTimes(3);
      expect(isBuiltinThemeRegistered("light")).toBe(true);
      expect(isBuiltinThemeRegistered("dark")).toBe(true);
      expect(isBuiltinThemeRegistered("macarons")).toBe(true);

      // Calling again should be a no-op (idempotent)
      vi.clearAllMocks();
      registerBuiltinThemes();
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });
  });
});
