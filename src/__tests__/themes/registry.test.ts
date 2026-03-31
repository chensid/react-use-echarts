import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts";
import { registerBuiltinThemes, getBuiltinTheme, getAvailableThemes } from "../../themes/registry";

// Mock ECharts
vi.mock("echarts", () => ({
  registerTheme: vi.fn(),
}));

describe("themes registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBuiltinTheme", () => {
    it("should return light theme config", () => {
      const theme = getBuiltinTheme("light");
      expect(theme).toBeDefined();
      expect(theme).toHaveProperty("color");
    });

    it("should return dark theme config", () => {
      const theme = getBuiltinTheme("dark");
      expect(theme).toBeDefined();
      expect(theme).toHaveProperty("color");
    });

    it("should return macarons theme config", () => {
      const theme = getBuiltinTheme("macarons");
      expect(theme).toBeDefined();
      expect(theme).toHaveProperty("color");
    });

    it("should return null for unknown theme", () => {
      // @ts-expect-error - testing invalid input
      const theme = getBuiltinTheme("unknown");
      expect(theme).toBeNull();
    });
  });

  describe("getAvailableThemes", () => {
    it("should return all builtin theme names", () => {
      const themes = getAvailableThemes();
      expect(themes).toContain("light");
      expect(themes).toContain("dark");
      expect(themes).toContain("macarons");
      expect(themes).toHaveLength(3);
    });
  });

  describe("registerBuiltinThemes", () => {
    it("should register all builtin themes and be idempotent on subsequent calls", () => {
      registerBuiltinThemes();

      expect(echarts.registerTheme).toHaveBeenCalledWith("light", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("dark", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("macarons", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledTimes(3);

      // Calling again should be a no-op (idempotent)
      vi.clearAllMocks();
      registerBuiltinThemes();
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });
  });
});
