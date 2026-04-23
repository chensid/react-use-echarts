import { useEffect, useRef, useCallback, useLayoutEffect, useMemo, type RefObject } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type { EChartsEvents, EChartsInitOpts, UseEchartsOptions, LoadingOption } from "../../types";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
} from "../../utils/instance-cache";
import { updateGroup, getInstanceGroup } from "../../utils/connect";
import { getOrRegisterCustomTheme, isKnownTheme } from "../../themes";
import { shallowEqual } from "../../utils/shallow-equal";
import { computeStableKey, isCircularFallbackKey } from "../../utils/stable-key";
import { warnedThemeNames, warnedZeroSizeContainers } from "../../utils/dev-warnings";
import { bindEvents, unbindEvents, eventsEqual } from "./event-utils";

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用，仅可在 effect 内调用）。
 *
 * @param themeKey Pre-computed key from computeStableKey — passed as contentHash
 *   to avoid redundant JSON.stringify inside getOrRegisterCustomTheme.
 */
function resolveThemeName(
  theme: string | object | null | undefined,
  themeKey: string | null,
): string | null {
  if (theme == null) return null;
  if (typeof theme === "string") {
    if (
      process.env.NODE_ENV !== "production" &&
      !isKnownTheme(theme) &&
      !warnedThemeNames.has(theme)
    ) {
      warnedThemeNames.add(theme);
      console.warn(
        `react-use-echarts: theme "${theme}" is not built-in and was not registered via registerCustomTheme(). ` +
          `If you registered it directly with echarts.registerTheme(), switch to registerCustomTheme() to silence this warning. ` +
          `Unknown names silently fall back to the default theme.`,
      );
    }
    return theme;
  }
  if (typeof theme !== "object") return null;
  const contentHash = themeKey && !isCircularFallbackKey(themeKey) ? themeKey : undefined;
  return getOrRegisterCustomTheme(theme, contentHash);
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

function warnZeroSizeContainer(element: HTMLElement): void {
  if (
    warnedZeroSizeContainers.has(element) ||
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test"
  ) {
    return;
  }

  let width = 0;
  let height = 0;
  try {
    const rect = element.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  } catch {
    // getBoundingClientRect is highly reliable on mounted elements but can throw in
    // exotic environments (detached SVG, cross-realm nodes); skip warning in those cases.
    return;
  }
  if (width > 0 && height > 0) return;

  warnedZeroSizeContainers.add(element);
  console.warn(
    "react-use-echarts: chart container has zero width or height during initialization. " +
      "Give the container an explicit size; <EChart /> defaults to height: 100%, " +
      "so its parent also needs an explicit height.",
  );
}

// --- Types ---

interface LastApplied {
  option: EChartsOption;
  opts: SetOptionOpts | undefined;
}

interface LastLoading {
  showLoading: boolean;
  loadingOption: LoadingOption | undefined;
}

interface ChartCoreConfig {
  option: EChartsOption;
  theme?: UseEchartsOptions["theme"];
  renderer?: "canvas" | "svg";
  initOpts?: EChartsInitOpts;
  setOptionOpts?: SetOptionOpts;
  showLoading?: boolean;
  loadingOption?: LoadingOption;
  onEvents?: EChartsEvents;
  group?: string;
  onError?: (e: unknown) => void;
}

interface ChartCoreReturn {
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
  ref: RefObject<HTMLDivElement | null>,
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
  const lastLoadingRef = useRef<LastLoading | null>(null);

  // --- Stable dependency keys ---
  const themeKey = useMemo(() => computeStableKey(theme), [theme]);
  const initOptsKey = useMemo(() => computeStableKey(initOpts), [initOpts]);

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

    warnZeroSizeContainer(element);

    const resolvedTheme = resolveThemeName(themeRef.current, themeKey);

    const existing = getCachedInstance(element);
    let instance: ECharts;
    if (existing) {
      /* v8 ignore next 4 -- NODE_ENV is always "test" in vitest; production branch never taken */
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "react-use-echarts: multiple hooks share the same DOM element. " +
            "The shared instance will be reused - theme/renderer/initOpts changes will not recreate it, " +
            "and option/events/loading/group updates from different hooks may overwrite each other.",
        );
      }
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
    lastLoadingRef.current = {
      showLoading: showLoadingRef.current,
      loadingOption: loadingOptionRef.current,
    };

    bindEvents(instance, onEventsRef.current);
    boundEventsRef.current = onEventsRef.current;

    const currentGroup = groupRef.current;
    if (currentGroup) {
      updateGroup(instance, undefined, currentGroup);
    }

    return () => {
      lastAppliedRef.current = null;
      lastLoadingRef.current = null;

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
    if (last) {
      // Fast path: identical refs skip shallowEqual's typeof/keys dispatch
      if (last.option === option && last.opts === setOptionOpts) return;
      if (shallowEqual(last.option, option) && shallowEqual(last.opts, setOptionOpts)) return;
    }

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

    if (eventsEqual(boundEventsRef.current, onEvents)) return;

    unbindEvents(instance, boundEventsRef.current);
    bindEvents(instance, onEvents);
    boundEventsRef.current = onEvents;
  }, [getInstance, onEvents]);

  // =====================================================================
  // Effect 4: LOADING STATE
  //
  // Toggles showLoading / hideLoading on dynamic changes.
  // Init effect handles initial application on instance creation;
  // lastLoadingRef + shallowEqual skips redundant calls for inline
  // loadingOption objects with identical content.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const last = lastLoadingRef.current;
    if (last && last.showLoading === showLoading && shallowEqual(last.loadingOption, loadingOption))
      return;

    if (showLoading) {
      instance.showLoading(loadingOption);
    } else {
      instance.hideLoading();
    }
    lastLoadingRef.current = { showLoading, loadingOption };
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
