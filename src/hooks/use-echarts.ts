import { useRef, useCallback, useLayoutEffect, useMemo } from "react";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type { UseEchartsOptions, UseEchartsReturn, EChartsEvents } from "../types";
import { useLazyInit } from "./use-lazy-init";
import { getCachedInstance } from "../utils/instance-cache";
import { useInstanceLifecycle } from "./internal/use-instance-lifecycle";
import { useOptionSync } from "./internal/use-option-sync";
import type { LastApplied } from "./internal/types";
import { useLoading } from "./internal/use-loading";
import { useEvents } from "./internal/use-events";
import { useGroup } from "./internal/use-group";
import { useResizeObserver } from "./internal/use-resize-observer";

// Stable IDs for theme objects that cannot be JSON-serialized (e.g. circular references)
const circularThemeIds = new WeakMap<object, string>();
let circularIdCounter = 0;

/**
 * Pure computation of a stable identity key for theme (no side effects).
 * Used during render for effect dependency tracking.
 * 纯粹计算主题的稳定标识键（无副作用），用于渲染阶段的 effect 依赖跟踪。
 *
 * - null/undefined → null
 * - string         → theme name (any registered theme)
 * - custom object  → JSON content hash (stable for same content)
 */
function computeThemeKey(theme: string | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === "string") return theme;
  if (typeof theme === "object") {
    try {
      return JSON.stringify(theme);
    } catch {
      // Circular reference: assign a stable ID via WeakMap
      let id = circularThemeIds.get(theme);
      if (!id) {
        id = `__circular_${circularIdCounter++}`;
        circularThemeIds.set(theme, id);
      }
      return id;
    }
  }
  return null;
}

// ---------- Hook ----------

/**
 * React hook for Apache ECharts integration
 * Apache ECharts React Hook
 *
 * @param ref React ref to the chart container element
 * @param options Configuration options
 * @returns Chart control methods
 */
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions,
): UseEchartsReturn {
  const {
    option,
    theme,
    renderer = "canvas",
    lazyInit = false,
    group,
    setOptionOpts,
    showLoading = false,
    loadingOption,
    onEvents,
    autoResize = true,
    initOpts,
    onError,
  } = options;

  // --- Stable refs for values used in init effect without triggering re-run ---
  const optionRef = useRef(option);
  const setOptionOptsRef = useRef(setOptionOpts);
  const showLoadingRef = useRef(showLoading);
  const loadingOptionRef = useRef(loadingOption);
  const onEventsRef = useRef(onEvents);
  const groupRef = useRef(group);
  const onErrorRef = useRef(onError);
  const themeRef = useRef(theme);
  const initOptsRef = useRef(initOpts);

  // Sync refs via useLayoutEffect (runs before other effects, avoids lint error)
  useLayoutEffect(() => {
    optionRef.current = option;
    setOptionOptsRef.current = setOptionOpts;
    showLoadingRef.current = showLoading;
    loadingOptionRef.current = loadingOption;
    onEventsRef.current = onEvents;
    groupRef.current = group;
    onErrorRef.current = onError;
    themeRef.current = theme;
    initOptsRef.current = initOpts;
  });

  // Track bound events for proper cleanup
  const boundEventsRef = useRef<EChartsEvents | undefined>(undefined);

  // Track what option/opts was last applied by init effect,
  // used to prevent duplicate setOption call from the option update effect
  const lastAppliedRef = useRef<LastApplied | null>(null);

  // Lazy initialization
  const shouldInit = useLazyInit(ref, lazyInit);

  // Pure computation of theme identity key for effect dependency.
  // No side effects: only reads caches / computes content hash.
  // useMemo ensures JSON.stringify runs only when theme reference changes.
  const themeKey = useMemo(() => computeThemeKey(theme), [theme]);

  // Stable identity key for initOpts (same pattern as themeKey).
  // Prevents infinite re-init when users pass inline objects.
  const initOptsKey = useMemo(() => (initOpts ? JSON.stringify(initOpts) : null), [initOpts]);

  // --- Public API ---

  const getInstance = useCallback((): ECharts | undefined => {
    if (!ref.current) return undefined;
    return getCachedInstance(ref.current);
  }, [ref]);

  const setOption = useCallback(
    (newOption: EChartsOption, opts?: SetOptionOpts) => {
      const instance = getInstance();
      if (!instance) return;
      try {
        const finalOpts = { ...setOptionOptsRef.current, ...opts };
        instance.setOption(newOption, finalOpts);
      } catch (error) {
        if (onErrorRef.current) {
          onErrorRef.current(error);
        } else {
          throw error;
        }
      }
    },
    [getInstance],
  );

  const resize = useCallback(() => {
    getInstance()?.resize();
  }, [getInstance]);

  // --- Internal effects (one hook per responsibility) ---

  useInstanceLifecycle(
    ref,
    shouldInit,
    themeKey,
    renderer,
    initOptsKey,
    optionRef,
    setOptionOptsRef,
    showLoadingRef,
    loadingOptionRef,
    onEventsRef,
    groupRef,
    onErrorRef,
    themeRef,
    initOptsRef,
    lastAppliedRef,
    boundEventsRef,
  );

  useOptionSync(getInstance, option, setOptionOpts, lastAppliedRef, onErrorRef);

  useLoading(getInstance, showLoading, loadingOption);

  useEvents(getInstance, onEvents, boundEventsRef);

  useGroup(getInstance, group);

  useResizeObserver(ref, autoResize);

  return useMemo(() => ({ setOption, getInstance, resize }), [setOption, getInstance, resize]);
}

export default useEcharts;
