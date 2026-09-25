"use client";

import * as echarts from "echarts/core";
import type { BuiltinTheme } from "../types";
import { isBuiltinThemeRegistered, markBuiltinThemeRegistered } from "./index";

// ECharts 6 ships "dark" natively and "light" maps to its "default" theme, so
// only macarons needs preset JSON.
import macaronsTheme from "./presets/macarons.json";

const builtinThemes: ReadonlyArray<readonly [BuiltinTheme, object]> = [["macarons", macaronsTheme]];

/**
 * Register the built-in themes that ECharts 6 does not provide itself
 * (currently `"macarons"`). `"light"` and `"dark"` work without this call.
 * Idempotent; call once at app startup.
 * 注册 ECharts 6 未自带的内置主题（目前为 "macarons"）。"light" / "dark" 无需调用。
 */
export function registerBuiltinThemes(): void {
  for (const [themeName, themeConfig] of builtinThemes) {
    if (isBuiltinThemeRegistered(themeName)) continue;
    echarts.registerTheme(themeName, themeConfig);
    markBuiltinThemeRegistered(themeName);
  }
}
