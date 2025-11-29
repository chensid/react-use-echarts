import * as echarts from "echarts";
import type { BuiltinTheme } from "../types";

// Import theme presets
import lightTheme from "./presets/light.json";
import darkTheme from "./presets/dark.json";
import macaronsTheme from "./presets/macarons.json";

/**
 * Theme registry for built-in themes
 * 内置主题注册表
 */
const themeRegistry = new Map<string, object>([
  ['light', lightTheme],
  ['dark', darkTheme],
  ['macarons', macaronsTheme],
]);

/**
 * Register built-in themes with ECharts
 * 向 ECharts 注册内置主题
 */
export function registerBuiltinThemes(): void {
  for (const [themeName, themeConfig] of themeRegistry.entries()) {
    echarts.registerTheme(themeName, themeConfig);
  }
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
 * Check if a theme name is a built-in theme
 * 检查主题名是否为内置主题
 * @param themeName Theme name to check
 * @returns True if built-in theme
 */
export function isBuiltinTheme(themeName: string): themeName is BuiltinTheme {
  return themeRegistry.has(themeName);
}

/**
 * Register a custom theme
 * 注册自定义主题
 * @param themeName Theme name
 * @param themeConfig Theme configuration object
 */
export function registerCustomTheme(themeName: string, themeConfig: object): void {
  echarts.registerTheme(themeName, themeConfig);
}

/**
 * Get all available built-in theme names
 * 获取所有可用的内置主题名称
 * @returns Array of built-in theme names
 */
export function getAvailableThemes(): BuiltinTheme[] {
  return Array.from(themeRegistry.keys()) as BuiltinTheme[];
}

// Auto-register built-in themes on module load
// 模块加载时自动注册内置主题
registerBuiltinThemes();
