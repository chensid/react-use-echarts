import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts/core";
import {
  isBuiltinTheme,
  isBuiltinThemeRegistered,
  isKnownTheme,
  markBuiltinThemeRegistered,
  registerCustomTheme,
  __clearThemeCacheForTesting__,
} from "../../themes";

// Mock ECharts
vi.mock("echarts/core", () => ({
  registerTheme: vi.fn(),
}));

describe("themes utilities", () => {
  beforeEach(() => {
    __clearThemeCacheForTesting__();
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
    it("should treat light/dark as always registered (ECharts 6 native)", () => {
      expect(isBuiltinThemeRegistered("light")).toBe(true);
      expect(isBuiltinThemeRegistered("dark")).toBe(true);
    });

    it("should track registered builtin themes separately from builtin names", () => {
      expect(isBuiltinTheme("macarons")).toBe(true);
      expect(isBuiltinThemeRegistered("macarons")).toBe(false);

      markBuiltinThemeRegistered("macarons");

      expect(isBuiltinThemeRegistered("macarons")).toBe(true);
    });

    it("should clear registered builtin theme state", () => {
      markBuiltinThemeRegistered("macarons");
      __clearThemeCacheForTesting__();

      expect(isBuiltinThemeRegistered("macarons")).toBe(false);
    });
  });

  describe("isKnownTheme", () => {
    it("should know built-ins and the names echarts/core registers itself", () => {
      for (const name of ["light", "dark", "macarons", "default"]) {
        expect(isKnownTheme(name)).toBe(true);
      }
      expect(isKnownTheme("not-registered")).toBe(false);
    });
  });

  describe("registerCustomTheme", () => {
    it("should register custom theme with echarts", () => {
      const customTheme = { color: ["#ff0000", "#00ff00", "#0000ff"] };

      registerCustomTheme("myCustomTheme", customTheme);

      expect(echarts.registerTheme).toHaveBeenCalledWith("myCustomTheme", customTheme);
    });
  });

  describe("shared global registry state", () => {
    it("keeps registration state on a globalThis singleton so duplicate library copies share it", () => {
      registerCustomTheme("shared-theme", { color: ["#shared"] });

      const globalState = (globalThis as Record<string, unknown>)[
        "__react_use_echarts_theme_state__"
      ] as Record<string, unknown> & { knownThemeNames: Set<string> };

      expect(globalState.knownThemeNames.has("shared-theme")).toBe(true);
      expect(isKnownTheme("shared-theme")).toBe(true);
      // Older library copies (<= 3.1) sharing the singleton read these fields.
      expect(globalState.customThemeCache).toBeInstanceOf(WeakMap);
      expect(globalState.contentHashCache).toBeInstanceOf(Map);
      expect(globalState.customThemeCounter).toBe(0);
    });
  });

  describe("__clearThemeCacheForTesting__", () => {
    it("should forget names registered through the library", () => {
      registerCustomTheme("to-forget", {});
      __clearThemeCacheForTesting__();
      expect(isKnownTheme("to-forget")).toBe(false);
    });
  });
});
