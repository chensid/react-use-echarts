/**
 * Dev-only warnings, each emitted once: dedup state is module-level, so repeated
 * renders and recreated instances don't repeat a warning.
 * dev-only 警告：去重状态为 module 级单例，同一情况只警告一次。
 *
 * Each helper checks NODE_ENV first: the production build defines it as
 * "production", so the guard folds to `if (true) return;` and the whole body,
 * warning text included, is dropped. With a `.has()` call leading the
 * condition, minifiers couldn't prove the early return unconditional.
 */

export const warnedThemeNames = new Set<string>();
const warnedZeroSizeContainers = new WeakSet<HTMLElement>();
let warnedMissingRegistration = false;

export function warnZeroSizeContainer(element: HTMLElement): void {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test" ||
    warnedZeroSizeContainers.has(element)
  ) {
    return;
  }

  try {
    const { width, height } = element.getBoundingClientRect();
    if (width > 0 && height > 0) return;
  } catch {
    // Best-effort: skip the warning where measuring throws (exotic environments).
    return;
  }

  warnedZeroSizeContainers.add(element);
  console.warn(
    "react-use-echarts: chart container has zero width or height during initialization. " +
      "Give the container an explicit size; <EChart /> defaults to height: 100%, " +
      "so its parent also needs an explicit height.",
  );
}

/**
 * Hint for the most common modular-entry pitfall: rendering before any
 * chart/renderer/component is registered makes ECharts throw a minifier-mangled
 * "<X> is not a constructor" that gives no clue. Logged alongside the real
 * error, not instead of it.
 * dev 专用：未注册图表/渲染器/组件时 init 会抛出混淆后的 "... is not a constructor"，
 * 此提示引导用户注册，与原错误一并输出。
 */
export function warnMissingRegistration(error: unknown): void {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test" ||
    warnedMissingRegistration
  ) {
    return;
  }

  // String(err) yields e.g. "TypeError: ka[a] is not a constructor" and
  // stringifies non-Error throws safely too.
  if (!String(error).includes("is not a constructor")) return;

  warnedMissingRegistration = true;
  console.warn(
    'react-use-echarts: ECharts init failed with a "... is not a constructor" error. ' +
      "This usually means no charts/renderers/components are registered yet. " +
      'Call registerEchartsFull() from "react-use-echarts/preset-full" at your app entry, ' +
      "or echarts.use([...]) selectively — both must run before the first useEcharts() render. " +
      'See the README "Register ECharts modules" section.',
  );
}

/**
 * Reset dev warning state (for testing). The WeakSet can't be cleared; its
 * entries go away with their elements.
 */
export function resetDevWarnings(): void {
  warnedThemeNames.clear();
  warnedMissingRegistration = false;
}
