import { describe, it, expect, vi, beforeEach } from "vitest";
import * as echarts from "echarts";
import {
  registerBuiltinThemes,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
  getOrRegisterCustomTheme,
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

  describe("getOrRegisterCustomTheme", () => {
    it("should return cached name for same object reference (WeakMap hit)", () => {
      const theme = { color: ["#aaa", "#bbb"] };

      const name1 = getOrRegisterCustomTheme(theme);
      vi.clearAllMocks();
      const name2 = getOrRegisterCustomTheme(theme);

      expect(name1).toBe(name2);
      // Second call should NOT register again
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });

    it("should deduplicate different references with same content (contentHash hit)", () => {
      const theme1 = { color: ["#111", "#222", "#333"] };
      const theme2 = { color: ["#111", "#222", "#333"] };

      const name1 = getOrRegisterCustomTheme(theme1);
      vi.clearAllMocks();
      const name2 = getOrRegisterCustomTheme(theme2);

      expect(name1).toBe(name2);
      // Second call should NOT register again (content hash match)
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });

    it("should register different themes with different names", () => {
      const themeA = { color: ["#aaa"] };
      const themeB = { color: ["#bbb"] };

      const nameA = getOrRegisterCustomTheme(themeA);
      const nameB = getOrRegisterCustomTheme(themeB);

      expect(nameA).not.toBe(nameB);
      expect(echarts.registerTheme).toHaveBeenCalledTimes(2);
    });
  });
});

