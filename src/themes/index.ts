import * as echarts from "echarts/core";
import type { BuiltinTheme } from "../types";
import { resetDevWarnings } from "../utils/dev-warnings";

/**
 * Hardcoded set of built-in theme names (no JSON dependency)
 * 内置主题名称硬编码集合（不依赖 JSON 数据）
 */
const BUILTIN_THEME_NAMES: ReadonlySet<string> = new Set<string>(["light", "dark", "macarons"]);

/**
 * Built-in names that work without the registry subpath. `echarts/core`
 * registers `"dark"` itself, and ECharts has no `"light"` theme, so that name
 * falls through to ECharts' default (light) theme. Only `"macarons"` ships as
 * JSON in `react-use-echarts/themes/registry`.
 * 无需 registry 子入口即可使用的内置主题：echarts/core 自带 "dark"；ECharts 没有
 * "light" 主题，该名称会回落到默认（浅色）主题。只有 "macarons" 需要注册。
 */
const NATIVE_BUILTIN_THEME_NAMES: ReadonlySet<string> = new Set<string>(["light", "dark"]);

/**
 * Names `echarts/core` registers itself, known without going through this library.
 * echarts/core 自身注册的主题名。
 */
const ECHARTS_NATIVE_THEME_NAMES: ReadonlySet<string> = new Set<string>(["default", "dark"]);

const THEME_STATE_KEY = "__react_use_echarts_theme_state__";

/**
 * Registration state shared through a `globalThis` singleton, so two bundled
 * copies of this library agree on which names were registered (dev warnings
 * stay coherent across copies).
 * 通过 globalThis 单例共享的注册状态，使多份打包的库副本对已注册主题名保持一致。
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
    // Fields read by react-use-echarts <= 3.1, which registered custom theme
    // objects under generated names. An older copy sharing this singleton
    // would crash on a state object created without them.
    customThemeCache: new WeakMap<object, string>(),
    contentHashCache: new Map<string, string>(),
    customThemeCounter: 0,
  } as ThemeRegistryState);

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
 * Whether a theme name is built-in, registered by `echarts/core` itself
 * (`"default"`, `"dark"`), or registered through `registerCustomTheme`.
 * Names registered directly via `echarts.registerTheme` will return `false`.
 * 判断主题名是否为内置主题、echarts/core 自带主题，或通过 `registerCustomTheme`
 * 注册过。外部直接通过 `echarts.registerTheme` 注册的名称会返回 `false`。
 */
export function isKnownTheme(themeName: string): boolean {
  return (
    BUILTIN_THEME_NAMES.has(themeName) ||
    ECHARTS_NATIVE_THEME_NAMES.has(themeName) ||
    state.knownThemeNames.has(themeName)
  );
}

/**
 * Whether a built-in theme is usable: `"light"` / `"dark"` always are (ECharts 6
 * provides them), `"macarons"` only after `registerBuiltinThemes()`.
 * Used internally for dev-time warnings without importing preset JSON.
 */
export function isBuiltinThemeRegistered(themeName: BuiltinTheme): boolean {
  return (
    NATIVE_BUILTIN_THEME_NAMES.has(themeName) || state.registeredBuiltinThemeNames.has(themeName)
  );
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
 * Reset registration state — test-only.
 * 重置注册状态，仅用于测试。
 *
 * @internal Test hook; not part of the public API.
 */
export function __clearThemeCacheForTesting__(): void {
  state.knownThemeNames.clear();
  state.registeredBuiltinThemeNames.clear();
  resetDevWarnings();
}
