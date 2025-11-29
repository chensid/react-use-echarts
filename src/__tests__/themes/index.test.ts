import { describe, it, expect, vi, beforeEach } from "vitest";
import * as echarts from "echarts";
import {
  registerBuiltinThemes,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
} from "../../themes";

// Mock ECharts
vi.mock("echarts", () => ({
  registerTheme: vi.fn(),
}));

describe("themes utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isBuiltinTheme", () => {
    it("should return true for light theme", () => {
      expect(isBuiltinTheme("light")).toBe(true);
    });

    it("should return true for dark theme", () => {
      expect(isBuiltinTheme("dark")).toBe(true);
    });

    it("should return true for macarons theme", () => {
      expect(isBuiltinTheme("macarons")).toBe(true);
    });

    it("should return false for unknown theme", () => {
      expect(isBuiltinTheme("unknown")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isBuiltinTheme("")).toBe(false);
    });
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
    it("should register all builtin themes with echarts", () => {
      registerBuiltinThemes();

      expect(echarts.registerTheme).toHaveBeenCalledWith("light", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("dark", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledWith("macarons", expect.any(Object));
      expect(echarts.registerTheme).toHaveBeenCalledTimes(3);
    });
  });

  describe("registerCustomTheme", () => {
    it("should register custom theme with echarts", () => {
      const customTheme = { color: ["#ff0000", "#00ff00", "#0000ff"] };

      registerCustomTheme("myCustomTheme", customTheme);

      expect(echarts.registerTheme).toHaveBeenCalledWith("myCustomTheme", customTheme);
    });
  });
});

