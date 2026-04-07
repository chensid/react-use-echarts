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

    it("should deduplicate content even after many unique registrations", () => {
      // Register 100 unique themes
      for (let i = 0; i < 100; i++) {
        getOrRegisterCustomTheme({ color: [`#${String(i).padStart(6, "0")}`] });
      }

      const callsBefore = (echarts.registerTheme as ReturnType<typeof vi.fn>).mock.calls.length;

      // A new reference with same content as theme #0 should NOT re-register
      const duplicate = { color: [`#${String(0).padStart(6, "0")}`] };
      const name = getOrRegisterCustomTheme(duplicate);
      expect(name).toMatch(/__custom_theme_\d+/);
      expect(echarts.registerTheme).toHaveBeenCalledTimes(callsBefore);

      // WeakMap fast path still works for the new reference
      const name2 = getOrRegisterCustomTheme(duplicate);
      expect(name2).toBe(name);
    });
  });
});
