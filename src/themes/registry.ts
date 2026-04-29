"use client";

import * as echarts from "echarts";
import type { BuiltinTheme } from "../types";
import { isBuiltinThemeRegistered, markBuiltinThemeRegistered } from "./index";

// Import theme presets (heavy — ~20KB JSON)
import lightTheme from "./presets/light.json";
import darkTheme from "./presets/dark.json";
import macaronsTheme from "./presets/macarons.json";

const builtinThemes: ReadonlyArray<readonly [BuiltinTheme, object]> = [
  ["light", lightTheme],
  ["dark", darkTheme],
  ["macarons", macaronsTheme],
];

/**
 * Register all built-in themes with ECharts.
 * Call once at app startup to use built-in themes like "dark", "light", "macarons".
 * 向 ECharts 注册所有内置主题。在应用入口调用一次即可使用内置主题。
 */
export function registerBuiltinThemes(): void {
  for (const [themeName, themeConfig] of builtinThemes) {
    if (isBuiltinThemeRegistered(themeName)) continue;
    echarts.registerTheme(themeName, themeConfig);
    markBuiltinThemeRegistered(themeName);
  }
}
