import * as echarts from "echarts/core";
import type { BuiltinTheme } from "../types";
import { resetDevWarnings } from "../utils/dev-warnings";

/**
 * Hardcoded set of built-in theme names (no JSON dependency)
 * 内置主题名称硬编码集合（不依赖 JSON 数据）
 */
const BUILTIN_THEME_NAMES: ReadonlySet<string> = new Set<string>(["light", "dark", "macarons"]);

/**
 * Maximum entries kept in the content-hash cache before FIFO eviction.
 * 内容哈希缓存的上限，超出后按 FIFO 淘汰最旧条目。
 */
const MAX_CONTENT_CACHE_SIZE = 100;

const THEME_STATE_KEY = "__react_use_echarts_theme_state__";

/**
 * All mutable theme-registry state, kept in one object so it can live as a
 * single `globalThis` singleton. echarts' theme registry is a process-wide
 * singleton, so two bundled copies of this library MUST share this state —
 * otherwise each keeps its own `customThemeCounter` starting at 0 and both emit
 * `echarts.registerTheme("__custom_theme_0", ...)` for different objects, the
 * second silently clobbering the first. Sharing `knownThemeNames` /
 * `contentHashCache` likewise keeps dev warnings and content dedup coherent
 * across copies. Extends the rationale that previously kept only the built-in
 * registration set global.
 * 所有可变主题状态收进一个对象，作为单一 globalThis 单例。echarts 主题注册表是进程级
 * 单例，两份打包的库副本必须共享此状态，否则各自的 customThemeCounter 都从 0 开始，会
 * 向共享注册表写入同名的 `__custom_theme_0`，后者静默覆盖前者；共享 knownThemeNames /
 * contentHashCache 也让 dev 警告与内容去重在多副本间保持一致。
 */
interface ThemeRegistryState {
  /** Built-in theme names registered via the registry subpath. */
  registeredBuiltinThemeNames: Set<BuiltinTheme>;
  /**
   * Names known to be registered via this library's API. Used by `isKnownTheme`
   * for dev-time validation. External `echarts.registerTheme(...)` calls are
   * invisible here — route through `registerCustomTheme` to suppress warnings.
   * 通过本库 API 注册过的主题名。外部直接调用 `echarts.registerTheme` 的名字不会被
   * 记录，若要消除 dev 警告请改用 `registerCustomTheme`。
   */
  knownThemeNames: Set<string>;
  /**
   * Custom theme name cache (theme object -> registered name). Uses WeakMap to
   * allow garbage collection of theme objects.
   * 自定义主题名称缓存（主题对象 -> 已注册名称）；WeakMap 以允许主题对象被回收。
   */
  customThemeCache: WeakMap<object, string>;
  /**
   * Content-based cache for custom theme deduplication. Prevents ECharts global
   * registry from growing when different object references carry identical
   * content. Capped at MAX_CONTENT_CACHE_SIZE — oldest evicted on overflow (FIFO).
   * 基于内容的去重缓存，避免不同引用、相同内容重复注册；FIFO，上限 100。
   */
  contentHashCache: Map<string, string>;
  /** Monotonic counter for generated custom theme names. */
  customThemeCounter: number;
}

type ThemeGlobal = typeof globalThis & {
  [THEME_STATE_KEY]?: ThemeRegistryState;
};
const themeGlobal = globalThis as ThemeGlobal;
const state: ThemeRegistryState =
  themeGlobal[THEME_STATE_KEY] ??
  (themeGlobal[THEME_STATE_KEY] = {
    registeredBuiltinThemeNames: new Set<BuiltinTheme>(),
    knownThemeNames: new Set<string>(),
    customThemeCache: new WeakMap<object, string>(),
    contentHashCache: new Map<string, string>(),
    customThemeCounter: 0,
  });

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
 * Whether a theme name is either built-in or has been registered through this
 * library's API (`registerCustomTheme` / `getOrRegisterCustomTheme`).
 * Names registered directly via `echarts.registerTheme` will return `false`.
 * 判断主题名是否为内置主题或通过本库 API 注册过。外部直接通过
 * `echarts.registerTheme` 注册的名称会返回 `false`。
 */
export function isKnownTheme(themeName: string): boolean {
  return BUILTIN_THEME_NAMES.has(themeName) || state.knownThemeNames.has(themeName);
}

/**
 * Whether a built-in theme has been registered through the registry entry.
 * Used internally for dev-time warnings without importing preset JSON.
 */
export function isBuiltinThemeRegistered(themeName: BuiltinTheme): boolean {
  return state.registeredBuiltinThemeNames.has(themeName);
}

/**
 * Mark a built-in theme as registered by the optional registry entry.
 */
export function markBuiltinThemeRegistered(themeName: BuiltinTheme): void {
  state.registeredBuiltinThemeNames.add(themeName);
}

/**
 * Register a custom theme
 * 注册自定义主题
 * @param themeName Theme name
 * @param themeConfig Theme configuration object
 */
export function registerCustomTheme(themeName: string, themeConfig: object): void {
  echarts.registerTheme(themeName, themeConfig);
  state.knownThemeNames.add(themeName);
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
export function getOrRegisterCustomTheme(themeConfig: object, precomputedHash?: string): string {
  // Fast path: same object reference
  const cachedName = state.customThemeCache.get(themeConfig);
  if (cachedName) {
    return cachedName;
  }

  // Content-based dedup: different reference, same content
  // Use pre-computed hash if provided to avoid redundant JSON.stringify
  let contentHash: string | undefined = precomputedHash;
  if (contentHash === undefined) {
    try {
      contentHash = JSON.stringify(themeConfig);
    } catch {
      // Circular reference or non-serializable value: skip content dedup
    }
  }

  if (contentHash) {
    const existingName = state.contentHashCache.get(contentHash);
    if (existingName) {
      // Cache the reference for fast lookup next time
      state.customThemeCache.set(themeConfig, existingName);
      return existingName;
    }
  }

  // Register new theme
  const themeName = `__custom_theme_${state.customThemeCounter++}`;
  echarts.registerTheme(themeName, themeConfig);
  state.knownThemeNames.add(themeName);
  state.customThemeCache.set(themeConfig, themeName);
  if (contentHash) {
    if (state.contentHashCache.size >= MAX_CONTENT_CACHE_SIZE) {
      // Evict oldest entry (first inserted key in Map iteration order)
      const oldest = state.contentHashCache.keys().next().value!;
      state.contentHashCache.delete(oldest);
    }
    state.contentHashCache.set(contentHash, themeName);
  }

  return themeName;
}

/**
 * Reset theme caches and counter — test-only.
 * 重置主题缓存和计数器，仅用于测试。
 *
 * WeakMap (customThemeCache) is not cleared — object-keyed entries
 * are garbage collected naturally when test objects go out of scope.
 *
 * @internal Test hook; not part of the public API.
 */
export function __clearThemeCacheForTesting__(): void {
  state.contentHashCache.clear();
  state.knownThemeNames.clear();
  state.registeredBuiltinThemeNames.clear();
  state.customThemeCounter = 0;
  resetDevWarnings();
}
