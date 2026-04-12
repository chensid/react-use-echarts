import * as echarts from "echarts";
import type { BuiltinTheme } from "../types";

/**
 * Hardcoded set of built-in theme names (no JSON dependency)
 * 内置主题名称硬编码集合（不依赖 JSON 数据）
 */
const BUILTIN_THEME_NAMES: ReadonlySet<string> = new Set<string>(["light", "dark", "macarons"]);

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
 * Check if a theme name is a built-in theme
 * 检查主题名是否为内置主题
 * @param themeName Theme name to check
 * @returns True if built-in theme
 */
export function isBuiltinTheme(themeName: string): themeName is BuiltinTheme {
  return BUILTIN_THEME_NAMES.has(themeName);
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
  let contentHash: string | undefined;
  try {
    contentHash = JSON.stringify(themeConfig);
  } catch {
    // Circular reference or non-serializable value: skip content dedup
  }

  if (contentHash) {
    const existingName = contentHashCache.get(contentHash);
    if (existingName) {
      // Cache the reference for fast lookup next time
      customThemeCache.set(themeConfig, existingName);
      return existingName;
    }
  }

  // Register new theme
  const themeName = `__custom_theme_${customThemeCounter++}`;
  echarts.registerTheme(themeName, themeConfig);
  customThemeCache.set(themeConfig, themeName);
  if (contentHash) {
    contentHashCache.set(contentHash, themeName);
  }

  return themeName;
}
