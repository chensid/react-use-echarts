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
 * Cache for custom theme names (theme object -> registered theme name)
 * 自定义主题名称缓存（主题对象 -> 已注册的主题名称）
 * Uses WeakMap to allow garbage collection of theme objects
 */
const customThemeCache = new WeakMap<object, string>();

/**
 * Counter for generating unique custom theme names
 * 用于生成唯一自定义主题名称的计数器
 */
let customThemeCounter = 0;

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
 * Get or create a cached theme name for a custom theme object
 * This prevents memory leaks by reusing theme names for the same object reference
 * 获取或创建自定义主题对象的缓存主题名称
 * 通过为相同对象引用重用主题名称来防止内存泄漏
 * @param themeConfig Custom theme configuration object
 * @returns Cached or newly generated theme name
 */
export function getOrRegisterCustomTheme(themeConfig: object): string {
  // Check if this theme object is already cached
  const cachedName = customThemeCache.get(themeConfig);
  if (cachedName) {
    return cachedName;
  }

  // Generate a unique theme name and register it
  const themeName = `__custom_theme_${customThemeCounter++}`;
  echarts.registerTheme(themeName, themeConfig);
  customThemeCache.set(themeConfig, themeName);

  return themeName;
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
