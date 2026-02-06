import { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type { UseEchartsOptions, UseEchartsReturn, EChartsEvents, BuiltinTheme } from "../types";
import { useLazyInit } from "./use-lazy-init";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
} from "../utils/instance-cache";
import { updateGroup, getInstanceGroup } from "../utils/connect";
import { isBuiltinTheme, getOrRegisterCustomTheme, ensureBuiltinThemesRegistered } from "../themes";

/**
 * Pure computation of a stable identity key for theme (no side effects).
 * Used during render for effect dependency tracking.
 * 纯粹计算主题的稳定标识键（无副作用），用于渲染阶段的 effect 依赖跟踪。
 *
 * - null/undefined → null
 * - builtin string  → theme name ('light', 'dark', 'macarons')
 * - custom object   → JSON content hash (stable for same content)
 */
function computeThemeKey(theme: BuiltinTheme | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === 'string') return isBuiltinTheme(theme) ? theme : null;
  if (typeof theme === 'object') return JSON.stringify(theme);
  return null;
}

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用）。
 * 仅可在 effect 内部调用，不可在渲染阶段调用。
 */
function resolveThemeName(theme: BuiltinTheme | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === 'string' && isBuiltinTheme(theme)) return theme;
  if (typeof theme === 'object') return getOrRegisterCustomTheme(theme);
  return null;
}

/**
 * Bind events to ECharts instance
 * 绑定事件到 ECharts 实例
 */
function bindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, { handler, query, context }] of Object.entries(events)) {
    if (query) {
      instance.on(eventName, query, handler, context);
    } else {
      instance.on(eventName, handler, context);
    }
  }
}

/**
 * Unbind events from ECharts instance
 * 从 ECharts 实例解绑事件
 */
function unbindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, { handler }] of Object.entries(events)) {
    instance.off(eventName, handler);
  }
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
  options: UseEchartsOptions
): UseEchartsReturn {
  const {
    option,
    theme,
    renderer = 'canvas',
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
  });

  // Track bound events for proper cleanup
  const boundEventsRef = useRef<EChartsEvents | undefined>(undefined);

  // Track what option/opts was last applied by init effect,
  // used to prevent duplicate setOption call from the option update effect
  const lastAppliedRef = useRef<{ option: EChartsOption; opts: SetOptionOpts | undefined } | null>(null);

  // Lazy initialization
  const shouldInit = useLazyInit(ref, lazyInit);

  // Pure computation of theme identity key for effect dependency.
  // No side effects: only reads caches / computes content hash.
  // useMemo ensures JSON.stringify runs only when theme reference changes.
  const themeKey = useMemo(() => computeThemeKey(theme), [theme]);

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
    [getInstance]
  );

  const resize = useCallback(() => {
    getInstance()?.resize();
  }, [getInstance]);

  // =====================================================================
  // Effect 1: INSTANCE LIFECYCLE (init / recreate / cleanup)
  //
  // Depends on: shouldInit, ref, themeKey, renderer, initOpts
  // When theme or renderer changes, cleanup disposes the old instance
  // and the effect re-runs to create a new one with the new config.
  // All instance state (option, events, loading, group) is re-applied.
  // =====================================================================
  useLayoutEffect(() => {
    if (!shouldInit) return;

    const element = ref.current;
    if (!element) return;

    // Side effects (theme registration) are safe inside effects.
    // Read from ref (synced by prior useLayoutEffect) to avoid
    // capturing `theme` in closure and triggering exhaustive-deps.
    ensureBuiltinThemesRegistered();
    const resolvedTheme = resolveThemeName(themeRef.current);

    let instance: ECharts;
    try {
      instance = echarts.init(element, resolvedTheme, {
        renderer,
        ...initOpts,
      });
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        console.error("ECharts init failed:", error);
      }
      return;
    }

    setCachedInstance(element, instance);

    // Apply initial option
    try {
      instance.setOption(optionRef.current, setOptionOptsRef.current);
      lastAppliedRef.current = {
        option: optionRef.current,
        opts: setOptionOptsRef.current,
      };
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        console.error("ECharts setOption failed:", error);
      }
    }

    // Apply loading state
    if (showLoadingRef.current) {
      instance.showLoading(loadingOptionRef.current);
    }

    // Bind events
    bindEvents(instance, onEventsRef.current);
    boundEventsRef.current = onEventsRef.current;

    // Join group
    const currentGroup = groupRef.current;
    if (currentGroup) {
      updateGroup(instance, undefined, currentGroup);
    }

    // Cleanup (handles StrictMode double mount via reference counting)
    return () => {
      const inst = getCachedInstance(element);
      if (!inst) return;

      // Leave group
      const instGroup = getInstanceGroup(inst);
      if (instGroup) {
        updateGroup(inst, instGroup, undefined);
      }

      // Unbind events
      unbindEvents(inst, boundEventsRef.current);
      boundEventsRef.current = undefined;

      // Release (dispose when ref count reaches 0)
      releaseCachedInstance(element);
    };
  }, [shouldInit, ref, themeKey, renderer, initOpts]);

  // =====================================================================
  // Effect 2: OPTION UPDATES
  //
  // Runs when option or setOptionOpts changes after initialization.
  // Uses lastAppliedRef to skip the first run after init effect
  // (which already applied the same option).
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    // Skip if init effect already applied this exact option
    const last = lastAppliedRef.current;
    if (last && last.option === option && last.opts === setOptionOpts) return;

    try {
      instance.setOption(option, setOptionOpts);
      lastAppliedRef.current = { option, opts: setOptionOpts };
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        throw error;
      }
    }
  }, [getInstance, option, setOptionOpts]);

  // =====================================================================
  // Effect 3: LOADING STATE
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    if (showLoading) {
      instance.showLoading(loadingOption);
    } else {
      instance.hideLoading();
    }
  }, [getInstance, showLoading, loadingOption]);

  // =====================================================================
  // Effect 4: EVENT REBINDING
  //
  // When onEvents reference changes, unbind old and bind new handlers.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    // Same reference — already bound
    if (boundEventsRef.current === onEvents) return;

    unbindEvents(instance, boundEventsRef.current);
    bindEvents(instance, onEvents);
    boundEventsRef.current = onEvents;
  }, [getInstance, onEvents]);

  // =====================================================================
  // Effect 5: GROUP CHANGES
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const currentGroup = getInstanceGroup(instance);
    if (currentGroup === group) return;

    updateGroup(instance, currentGroup, group);
  }, [getInstance, group]);

  // =====================================================================
  // Effect 6: RESIZE OBSERVER
  // =====================================================================
  useEffect(() => {
    if (!autoResize) return;

    const element = ref.current;
    if (!element) return;

    let resizeObserver: ResizeObserver | undefined;

    try {
      resizeObserver = new ResizeObserver(() => {
        getCachedInstance(element)?.resize();
      });
      resizeObserver.observe(element);
    } catch (error) {
      console.warn("ResizeObserver not available:", error);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [ref, autoResize]);

  return { setOption, getInstance, resize };
}

export default useEcharts;
