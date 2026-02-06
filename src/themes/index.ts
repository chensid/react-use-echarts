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
 * Content-based cache for custom theme deduplication
 * 基于内容的缓存，用于自定义主题去重
 * Prevents ECharts global registry from growing when different
 * object references carry identical theme content
 */
const contentHashCache = new Map<string, string>();

/**
 * Counter for generating unique custom theme names
 * 用于生成唯一自定义主题名称的计数器
 */
let customThemeCounter = 0;

/**
 * Flag for lazy built-in theme registration
 * 内置主题惰性注册标志
 */
let builtinThemesRegistered = false;

/**
 * Register built-in themes with ECharts
 * 向 ECharts 注册内置主题
 */
export function registerBuiltinThemes(): void {
  for (const [themeName, themeConfig] of themeRegistry.entries()) {
    echarts.registerTheme(themeName, themeConfig);
  }
  builtinThemesRegistered = true;
}

/**
 * Ensure built-in themes are registered (lazy, idempotent)
 * 确保内置主题已注册（惰性、幂等）
 * Called automatically before chart initialization
 */
export function ensureBuiltinThemesRegistered(): void {
  if (builtinThemesRegistered) return;
  registerBuiltinThemes();
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
 * Get or create a cached theme name for a custom theme object.
 *
 * Uses two-level caching:
 * 1. WeakMap by object reference (O(1) fast path for same reference)
 * 2. Content hash Map (dedup for different references with identical content)
 *
 * This prevents ECharts global theme registry from growing unboundedly
 * when consumers forget to useMemo their theme objects.
 *
 * 获取或创建自定义主题对象的缓存主题名称。
 * 使用两级缓存：引用级 WeakMap + 内容级 Map，
 * 避免消费者未 useMemo 主题对象时导致 ECharts 全局注册无限增长。
 *
 * @param themeConfig Custom theme configuration object
 * @returns Cached or newly generated theme name
 */
export function getOrRegisterCustomTheme(themeConfig: object): string {
  // Fast path: same object reference
  const cachedName = customThemeCache.get(themeConfig);
  if (cachedName) {
    return cachedName;
  }

  // Content-based dedup: different reference, same content
  const contentHash = JSON.stringify(themeConfig);
  const existingName = contentHashCache.get(contentHash);
  if (existingName) {
    // Cache the reference for fast lookup next time
    customThemeCache.set(themeConfig, existingName);
    return existingName;
  }

  // Register new theme
  const themeName = `__custom_theme_${customThemeCounter++}`;
  echarts.registerTheme(themeName, themeConfig);
  customThemeCache.set(themeConfig, themeName);
  contentHashCache.set(contentHash, themeName);

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
