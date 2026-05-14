import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts/core";
import {
  isBuiltinTheme,
  isBuiltinThemeRegistered,
  markBuiltinThemeRegistered,
  registerCustomTheme,
  getOrRegisterCustomTheme,
  clearThemeCache,
} from "../../themes";

// Mock ECharts
vi.mock("echarts/core", () => ({
  registerTheme: vi.fn(),
}));

describe("themes utilities", () => {
  beforeEach(() => {
    clearThemeCache();
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

  describe("builtin theme registration state", () => {
    it("should track registered builtin themes separately from builtin names", () => {
      expect(isBuiltinTheme("dark")).toBe(true);
      expect(isBuiltinThemeRegistered("dark")).toBe(false);

      markBuiltinThemeRegistered("dark");

      expect(isBuiltinThemeRegistered("dark")).toBe(true);
    });

    it("should clear registered builtin theme state", () => {
      markBuiltinThemeRegistered("dark");
      clearThemeCache();

      expect(isBuiltinThemeRegistered("dark")).toBe(false);
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

    it("should handle circular reference theme objects without throwing", () => {
      const circularTheme: Record<string, unknown> = { color: ["#ccc"] };
      circularTheme.self = circularTheme;

      const name1 = getOrRegisterCustomTheme(circularTheme);
      expect(name1).toMatch(/__custom_theme_\d+/);
      expect(echarts.registerTheme).toHaveBeenCalled();

      // Same reference should return cached name
      vi.clearAllMocks();
      const name2 = getOrRegisterCustomTheme(circularTheme);
      expect(name2).toBe(name1);
      expect(echarts.registerTheme).not.toHaveBeenCalled();
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

    it("should evict oldest content cache entry when exceeding max size (FIFO)", () => {
      // Register 101 unique themes to trigger eviction (max is 100)
      for (let i = 0; i < 101; i++) {
        getOrRegisterCustomTheme({ palette: [`#evict_${String(i).padStart(6, "0")}`] });
      }

      // Theme #0's content hash should have been evicted, so a new reference
      // with that content should re-register (new theme name)
      const evicted = { palette: [`#evict_${String(0).padStart(6, "0")}`] };
      const callsBefore = (echarts.registerTheme as ReturnType<typeof vi.fn>).mock.calls.length;
      getOrRegisterCustomTheme(evicted);
      expect(echarts.registerTheme).toHaveBeenCalledTimes(callsBefore + 1);
    });

    it("should use pre-computed contentHash and skip internal JSON.stringify", () => {
      const theme = { color: ["#precomputed"] };
      const hash = JSON.stringify(theme);

      const name = getOrRegisterCustomTheme(theme, hash);
      expect(name).toMatch(/__custom_theme_\d+/);
      expect(echarts.registerTheme).toHaveBeenCalledTimes(1);

      // Different reference, same content, passing the same hash
      vi.clearAllMocks();
      const theme2 = { color: ["#precomputed"] };
      const name2 = getOrRegisterCustomTheme(theme2, hash);
      expect(name2).toBe(name);
      expect(echarts.registerTheme).not.toHaveBeenCalled();
    });
  });

  describe("clearThemeCache", () => {
    it("should reset counter so next theme gets __custom_theme_0", () => {
      getOrRegisterCustomTheme({ reset: ["#000"] });
      clearThemeCache();
      const name = getOrRegisterCustomTheme({ fresh: ["#111"] });
      expect(name).toBe("__custom_theme_0");
    });

    it("should clear content hash cache so identical content re-registers", () => {
      getOrRegisterCustomTheme({ dup: ["#aaa"] });
      clearThemeCache();
      vi.clearAllMocks();
      // New object with same content should register again after cache clear
      getOrRegisterCustomTheme({ dup: ["#aaa"] });
      expect(echarts.registerTheme).toHaveBeenCalledTimes(1);
    });
  });
});
