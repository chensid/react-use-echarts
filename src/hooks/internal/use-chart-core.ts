import { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type { EChartsEvents, EChartsInitOpts, UseEchartsOptions } from "../../types";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
} from "../../utils/instance-cache";
import { updateGroup, getInstanceGroup } from "../../utils/connect";
import { getOrRegisterCustomTheme } from "../../themes";
import { shallowEqual } from "../../utils/shallow-equal";
import { bindEvents, unbindEvents } from "./event-utils";

// --- Module-level helpers ---

// Stable IDs for theme objects that cannot be JSON-serialized (e.g. circular references)
const circularThemeIds = new WeakMap<object, string>();
let circularIdCounter = 0;

/**
 * Pure computation of a stable identity key for theme (no side effects).
 * 纯粹计算主题的稳定标识键（无副作用）。
 */
function computeThemeKey(theme: string | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === "string") return theme;
  if (typeof theme === "object") {
    try {
      return JSON.stringify(theme);
    } catch {
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

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用，仅可在 effect 内调用）。
 */
function resolveThemeName(theme: string | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === "string") return theme;
  if (typeof theme === "object") return getOrRegisterCustomTheme(theme);
  return null;
}

function logError(
  error: unknown,
  message: string,
  onError: ((e: unknown) => void) | undefined,
): void {
  if (onError) {
    onError(error);
  } else {
    console.error(message, error);
  }
}

// --- Types ---

interface LastApplied {
  option: EChartsOption;
  opts: SetOptionOpts | undefined;
}

export interface ChartCoreConfig {
  option: EChartsOption;
  theme?: UseEchartsOptions["theme"];
  renderer?: "canvas" | "svg";
  initOpts?: EChartsInitOpts;
  setOptionOpts?: SetOptionOpts;
  showLoading?: boolean;
  loadingOption?: Record<string, unknown>;
  onEvents?: EChartsEvents;
  group?: string;
  onError?: (e: unknown) => void;
}

export interface ChartCoreReturn {
  getInstance: () => ECharts | undefined;
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
}

// --- Hook ---

/**
 * Core chart hook: manages instance lifecycle, option sync, and event binding.
 *
 * Owns all internal refs and shared mutable state — callers pass raw values only.
 * 核心图表 hook：管理实例生命周期、option 同步和事件绑定。
 * 内部管理所有 ref 和共享可变状态——调用方仅传入原始值。
 */
export function useChartCore(
  ref: React.RefObject<HTMLDivElement | null>,
  shouldInit: boolean,
  config: ChartCoreConfig,
): ChartCoreReturn {
  const {
    option,
    theme,
    renderer = "canvas",
    initOpts,
    setOptionOpts,
    showLoading = false,
    loadingOption,
    onEvents,
    group,
    onError,
  } = config;

  // --- Internal refs: latest values for the init effect to read without re-triggering ---
  const optionRef = useRef(option);
  const setOptionOptsRef = useRef(setOptionOpts);
  const showLoadingRef = useRef(showLoading);
  const loadingOptionRef = useRef(loadingOption);
  const onEventsRef = useRef(onEvents);
  const groupRef = useRef(group);
  const onErrorRef = useRef(onError);
  const themeRef = useRef(theme);
  const initOptsRef = useRef(initOpts);

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

  // --- Internal shared state ---
  const boundEventsRef = useRef<EChartsEvents | undefined>(undefined);
  const lastAppliedRef = useRef<LastApplied | null>(null);

  // --- Stable dependency keys ---
  const themeKey = useMemo(() => computeThemeKey(theme), [theme]);
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

  // =====================================================================
  // Effect 1: INSTANCE LIFECYCLE (init / recreate / cleanup)
  //
  // When theme, renderer, or initOpts changes, cleanup disposes the old
  // instance and the effect re-runs to create a new one.
  // All instance state (option, events, loading, group) is re-applied.
  // =====================================================================
  useLayoutEffect(() => {
    if (!shouldInit) return;

    const element = ref.current;
    if (!element) return;

    const resolvedTheme = resolveThemeName(themeRef.current);

    const existing = getCachedInstance(element);
    let instance: ECharts;
    if (existing) {
      instance = existing;
      setCachedInstance(element, existing);
    } else {
      try {
        instance = echarts.init(element, resolvedTheme, {
          renderer,
          ...initOptsRef.current,
        });
      } catch (error) {
        logError(error, "ECharts init failed:", onErrorRef.current);
        return;
      }
      setCachedInstance(element, instance);
    }

    try {
      instance.setOption(optionRef.current, setOptionOptsRef.current);
      lastAppliedRef.current = {
        option: optionRef.current,
        opts: setOptionOptsRef.current,
      };
    } catch (error) {
      logError(error, "ECharts setOption failed:", onErrorRef.current);
    }

    if (showLoadingRef.current) {
      instance.showLoading(loadingOptionRef.current);
    }

    bindEvents(instance, onEventsRef.current);
    boundEventsRef.current = onEventsRef.current;

    const currentGroup = groupRef.current;
    if (currentGroup) {
      updateGroup(instance, undefined, currentGroup);
    }

    return () => {
      lastAppliedRef.current = null;

      const inst = getCachedInstance(element);
      if (!inst) return;

      const instGroup = getInstanceGroup(inst);
      if (instGroup) {
        updateGroup(inst, instGroup, undefined);
      }

      unbindEvents(inst, boundEventsRef.current);
      boundEventsRef.current = undefined;

      releaseCachedInstance(element);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable containers; only structural deps trigger re-init
  }, [shouldInit, ref, themeKey, renderer, initOptsKey]);

  // =====================================================================
  // Effect 2: OPTION UPDATES
  //
  // Uses lastAppliedRef to skip the first run after init effect
  // (which already applied the same option). shallowEqual prevents
  // unnecessary setOption when user creates new wrapper objects.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const last = lastAppliedRef.current;
    if (last && shallowEqual(last.option, option) && last.opts === setOptionOpts) return;

    try {
      instance.setOption(option, setOptionOpts);
      lastAppliedRef.current = { option, opts: setOptionOpts };
    } catch (error) {
      logError(error, "ECharts setOption failed:", onErrorRef.current);
    }
  }, [getInstance, option, setOptionOpts]);

  // =====================================================================
  // Effect 3: EVENT REBINDING
  //
  // When onEvents reference changes, unbind old and bind new handlers.
  // Uses boundEventsRef to track what's currently bound.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    if (boundEventsRef.current === onEvents) return;

    unbindEvents(instance, boundEventsRef.current);
    bindEvents(instance, onEvents);
    boundEventsRef.current = onEvents;
  }, [getInstance, onEvents]);

  // =====================================================================
  // Effect 4: LOADING STATE
  //
  // Toggles showLoading / hideLoading on dynamic changes.
  // Init effect handles initial application on instance creation.
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
  // Effect 5: GROUP CHANGES
  //
  // Switches chart group membership on dynamic changes.
  // Init effect handles initial group assignment on instance creation.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const currentGroup = getInstanceGroup(instance);
    if (currentGroup === group) return;

    updateGroup(instance, currentGroup, group);
  }, [getInstance, group]);

  return useMemo(() => ({ getInstance, setOption }), [getInstance, setOption]);
}
