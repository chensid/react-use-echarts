import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts";
import { isBuiltinTheme, registerCustomTheme, getOrRegisterCustomTheme } from "../../themes";

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

    it("should still work correctly after contentHashCache exceeds max size", () => {
      // Register 55 unique themes to exceed the 50-entry cap
      for (let i = 0; i < 55; i++) {
        getOrRegisterCustomTheme({ color: [`#${String(i).padStart(6, "0")}`] });
      }

      // Should still work correctly after cache clear
      const theme = { color: ["#unique-after-clear"] };
      const name = getOrRegisterCustomTheme(theme);
      expect(name).toMatch(/__custom_theme_\d+/);

      // Same reference should still return the same name (WeakMap fast path)
      const name2 = getOrRegisterCustomTheme(theme);
      expect(name2).toBe(name);
    });
  });
});
