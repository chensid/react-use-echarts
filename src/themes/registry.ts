import * as echarts from "echarts";
import type { BuiltinTheme } from "../types";

// Import theme presets (heavy — ~20KB JSON)
import lightTheme from "./presets/light.json";
import darkTheme from "./presets/dark.json";
import macaronsTheme from "./presets/macarons.json";

/**
 * Theme registry for built-in themes
 * 内置主题注册表
 */
const themeRegistry = new Map<string, object>([
  ["light", lightTheme],
  ["dark", darkTheme],
  ["macarons", macaronsTheme],
]);

/**
 * Flag for idempotent registration
 * 幂等注册标志
 */
let builtinThemesRegistered = false;

/**
 * Register all built-in themes with ECharts.
 * Call once at app startup to use built-in themes like "dark", "light", "macarons".
 * 向 ECharts 注册所有内置主题。在应用入口调用一次即可使用内置主题。
 */
export function registerBuiltinThemes(): void {
  if (builtinThemesRegistered) return;
  for (const [themeName, themeConfig] of themeRegistry.entries()) {
    echarts.registerTheme(themeName, themeConfig);
  }
  builtinThemesRegistered = true;
}

/**
 * Get built-in theme configuration
 * 获取内置主题配置
 * @param themeName Theme name
 * @returns Theme configuration object or null if not found
 */
export function getBuiltinTheme(themeName: BuiltinTheme): object | null {
  return themeRegistry.get(themeName) || null;
}

/**
 * Get all available built-in theme names
 * 获取所有可用的内置主题名称
 * @returns Array of built-in theme names
 */
export function getAvailableThemes(): BuiltinTheme[] {
  return Array.from(themeRegistry.keys()) as BuiltinTheme[];
}
