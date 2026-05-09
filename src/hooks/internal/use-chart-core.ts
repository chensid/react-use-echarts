import { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type {
  EChartsEvents,
  EChartsInitOpts,
  UseEchartsOptions,
  UseEchartsReturn,
  LoadingOption,
} from "../../types";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
} from "../../utils/instance-cache";
import { updateGroup, getInstanceGroup } from "../../utils/connect";
import {
  getOrRegisterCustomTheme,
  isBuiltinTheme,
  isBuiltinThemeRegistered,
  isKnownTheme,
} from "../../themes";
import { shallowEqual } from "../../utils/shallow-equal";
import { computeStableKey } from "../../utils/stable-key";
import { warnedThemeNames, warnedZeroSizeContainers } from "../../utils/dev-warnings";
import { routeEffectError, routeImperativeError } from "../../utils/error";
import { bindEvents, unbindEvents, eventsEqual } from "./event-utils";

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用，仅可在 effect 内调用）。
 *
 * @param themeKey Pre-computed key from computeStableKey — passed as contentHash
 *   to avoid redundant JSON.stringify inside getOrRegisterCustomTheme.
 *   `null` when the value isn't JSON-serializable.
 */
function resolveThemeName(
  theme: string | object | undefined,
  themeKey: string | null,
): string | null {
  // Public type forbids null, but JS callers can still pass it. typeof null
  // is "object" so without this guard we'd hit getOrRegisterCustomTheme(null)
  // and throw inside the WeakMap path — outside the init effect's try/catch.
  if (theme == null) return null;
  if (typeof theme === "string") {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test" &&
      isBuiltinTheme(theme) &&
      !isBuiltinThemeRegistered(theme) &&
      !warnedThemeNames.has(theme)
    ) {
      warnedThemeNames.add(theme);
      console.warn(
        `react-use-echarts: built-in theme "${theme}" was not registered. ` +
          `Import registerBuiltinThemes() from "react-use-echarts/themes/registry" and call it once before using built-in themes. ` +
          `Unregistered themes silently fall back to the default theme.`,
      );
    } else if (
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
  return getOrRegisterCustomTheme(theme, themeKey ?? undefined);
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

/**
 * Resolved latest values that must stay current for refs read inside effects
 * without re-triggering them. Defaults applied (renderer, showLoading) so the
 * fields are non-optional from the consumer's perspective.
 */
interface LatestConfig {
  option: EChartsOption;
  theme: UseEchartsOptions["theme"];
  renderer: "canvas" | "svg";
  initOpts: EChartsInitOpts | undefined;
  setOptionOpts: SetOptionOpts | undefined;
  showLoading: boolean;
  loadingOption: LoadingOption | undefined;
  onEvents: EChartsEvents | undefined;
  group: string | undefined;
  onError: ((e: unknown) => void) | undefined;
}

type ChartCoreReturn = UseEchartsReturn;

// --- Hook ---

/**
 * Core chart hook: manages instance lifecycle, option sync, and event binding.
 *
 * Owns all internal refs and shared mutable state — callers pass raw values only.
 * 核心图表 hook：管理实例生命周期、option 同步和事件绑定。
 * 内部管理所有 ref 和共享可变状态——调用方仅传入原始值。
 */
export function useChartCore(
  element: HTMLDivElement | null,
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

  // --- Internal ref: latest values for effects to read without re-triggering.
  // `buildLatest` is the single source — TS catches stale-config drift at the
  // return-type boundary. Lazy-init (`null!` + first-render assign) avoids
  // re-evaluating the literal on every render. Constraint: nothing may read
  // `latestRef.current` before the if-block runs.
  const buildLatest = (): LatestConfig => ({
    option,
    theme,
    renderer,
    initOpts,
    setOptionOpts,
    showLoading,
    loadingOption,
    onEvents,
    group,
    onError,
  });

  const latestRef = useRef<LatestConfig>(null!);
  if (latestRef.current === null) {
    latestRef.current = buildLatest();
  }

  useLayoutEffect(() => {
    latestRef.current = buildLatest();
  });

  // --- Internal shared state ---
  // Event map currently bound to the instance (undefined when none bound).
  // Used by Event Rebinding effect to dedup and unbind on prop changes.
  const lastBoundRef = useRef<EChartsEvents | undefined>(undefined);
  const lastAppliedRef = useRef<LastApplied | null>(null);
  const lastLoadingRef = useRef<LastLoading | null>(null);

  // --- Stable dependency keys ---
  const themeKey = useMemo(() => computeStableKey(theme), [theme]);
  const initOptsKey = useMemo(() => computeStableKey(initOpts), [initOpts]);

  // --- Public API ---

  const getInstance = useCallback((): ECharts | undefined => {
    if (!element) return undefined;
    return getCachedInstance(element);
  }, [element]);

  // =====================================================================
  // INSTANCE LIFECYCLE (init / recreate / cleanup)
  //
  // When theme, renderer, or initOpts changes, cleanup disposes the old
  // instance and the effect re-runs to create a new one.
  // All instance state (option, events, loading, group) is re-applied.
  // =====================================================================
  useLayoutEffect(() => {
    if (!shouldInit) return;

    if (!element) return;

    warnZeroSizeContainer(element);

    const latest = latestRef.current;
    const resolvedTheme = resolveThemeName(latest.theme, themeKey);

    const existing = getCachedInstance(element);
    let instance: ECharts;
    if (existing) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "react-use-echarts: multiple hooks share the same DOM element. " +
            "The shared instance is reused; theme/renderer/initOpts changes from later hooks are ignored, " +
            "and option/events/loading/group writes from later hooks overwrite earlier ones.",
        );
      }
      instance = existing;
      setCachedInstance(element, existing);
    } else {
      try {
        instance = echarts.init(element, resolvedTheme, {
          renderer,
          ...latest.initOpts,
        });
      } catch (error) {
        routeEffectError(error, "ECharts init failed:", latest.onError);
        return;
      }
      setCachedInstance(element, instance);
    }

    try {
      instance.setOption(latest.option, latest.setOptionOpts);
      lastAppliedRef.current = {
        option: latest.option,
        opts: latest.setOptionOpts,
      };
    } catch (error) {
      routeEffectError(error, "ECharts setOption failed:", latest.onError);
    }

    if (latest.showLoading) {
      instance.showLoading(latest.loadingOption);
    }
    lastLoadingRef.current = {
      showLoading: latest.showLoading,
      loadingOption: latest.loadingOption,
    };

    // Track for cleanup regardless of partial bind failure so off() can still
    // be attempted on any handlers that did get bound.
    lastBoundRef.current = latest.onEvents;
    try {
      bindEvents(instance, latest.onEvents);
    } catch (error) {
      routeEffectError(error, "ECharts event bind failed:", latest.onError);
    }

    if (latest.group) {
      updateGroup(instance, undefined, latest.group);
    }

    return () => {
      lastAppliedRef.current = null;
      lastLoadingRef.current = null;

      const inst = getCachedInstance(element);
      if (!inst) return;

      unbindEvents(inst, lastBoundRef.current);
      lastBoundRef.current = undefined;
      releaseCachedInstance(element);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latest config values are read from refs; only structural deps trigger re-init
  }, [shouldInit, element, themeKey, renderer, initOptsKey]);

  // =====================================================================
  // OPTION SYNC
  //
  // Uses lastAppliedRef to skip the first run after the lifecycle effect
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
      routeEffectError(error, "ECharts setOption failed:", latestRef.current.onError);
    }
  }, [getInstance, option, setOptionOpts]);

  // =====================================================================
  // EVENT REBINDING
  //
  // When onEvents reference changes, unbind old and bind new handlers.
  // Uses lastBoundRef to dedup against the currently-bound map.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    if (eventsEqual(lastBoundRef.current, onEvents)) return;

    // Order matters: ECharts `off(name, handler)` matches by handler reference
    // and ignores query/context, so a same-handler rebind (query A → query B)
    // must unbind the old binding BEFORE the new one is registered — otherwise
    // the off call would remove the freshly-bound handler too.
    unbindEvents(instance, lastBoundRef.current);
    try {
      bindEvents(instance, onEvents);
    } catch (error) {
      routeEffectError(error, "ECharts event bind failed:", latestRef.current.onError);
    }
    lastBoundRef.current = onEvents;
  }, [getInstance, onEvents]);

  // =====================================================================
  // LOADING TOGGLE
  //
  // Toggles showLoading / hideLoading on dynamic changes.
  // Lifecycle effect handles initial application on instance creation;
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
  // GROUP SWITCH
  //
  // Switches chart group membership on dynamic changes.
  // Lifecycle effect handles initial group assignment on instance creation.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const currentGroup = getInstanceGroup(instance);
    if (currentGroup === group) return;

    updateGroup(instance, currentGroup, group);
  }, [getInstance, group]);

  // =====================================================================
  // Imperative API surface
  //
  // All methods follow the "no instance → fallback (undefined / true / false)"
  // contract. When the instance throws: with onError, route the error and
  // return the fallback; without onError, rethrow (readers do NOT silently
  // log-and-default — same policy as setOption / dispatchAction). clear()
  // and appendData() additionally drop lastAppliedRef so a subsequent
  // shallow-equal prop rerender re-applies setOption (the instance state
  // has drifted from props).
  // =====================================================================
  return useMemo<ChartCoreReturn>(() => {
    const withInstance = <T>(fn: (instance: ECharts) => T, fallback: T): T => {
      const instance = getInstance();
      if (!instance) return fallback;
      try {
        return fn(instance);
      } catch (error) {
        routeImperativeError(error, latestRef.current.onError);
        return fallback;
      }
    };

    return {
      getInstance,

      setOption: (newOption, opts) =>
        withInstance((instance) => {
          const finalOpts = { ...latestRef.current.setOptionOpts, ...opts };
          instance.setOption(newOption, finalOpts);
          // Keep lastAppliedRef in sync so prop-driven Option-Sync Effect dedup
          // reflects what's actually on the instance, not what props last sent.
          lastAppliedRef.current = { option: newOption, opts: finalOpts };
        }, undefined),

      dispatchAction: (payload, opt) =>
        withInstance((instance) => instance.dispatchAction(payload, opt), undefined),

      clear: () =>
        withInstance((instance) => {
          instance.clear();
          // Drop dedup memory: instance is now blank, so a subsequent prop
          // rerender with a shallow-equal-but-new option ref must re-apply
          // it instead of being skipped by Option-Sync Effect's fast path.
          lastAppliedRef.current = null;
        }, undefined),

      resize: (opts) => withInstance((instance) => instance.resize(opts), undefined),

      getOption: () => withInstance((instance) => instance.getOption() as EChartsOption, undefined),
      getWidth: () => withInstance((instance) => instance.getWidth(), undefined),
      getHeight: () => withInstance((instance) => instance.getHeight(), undefined),
      getDom: () => withInstance((instance) => instance.getDom(), undefined),
      // No instance → semantically disposed. Errors still route via withInstance,
      // falling back to true so consumers don't act on a half-broken instance.
      isDisposed: () => withInstance((instance) => instance.isDisposed(), true),
      getDataURL: (opts) => withInstance((instance) => instance.getDataURL(opts), undefined),
      getConnectedDataURL: (opts) =>
        withInstance((instance) => instance.getConnectedDataURL(opts), undefined),
      renderToSVGString: (opts) =>
        withInstance((instance) => instance.renderToSVGString(opts), undefined),
      getSvgDataURL: () => withInstance((instance) => instance.getSvgDataURL(), undefined),
      // ECharts' convertToPixel/convertFromPixel are overloaded; passing through
      // the public widened signature requires `as never` to satisfy the
      // last-overload-only inference TypeScript performs on overloaded methods.
      convertToPixel: (finder, value) =>
        withInstance(
          (instance) => instance.convertToPixel(finder as never, value as never),
          undefined,
        ),
      convertFromPixel: (finder, value) =>
        withInstance(
          (instance) => instance.convertFromPixel(finder as never, value as never),
          undefined,
        ),
      containPixel: (finder, value) =>
        withInstance((instance) => instance.containPixel(finder, value), false),
      appendData: (params) =>
        withInstance((instance) => {
          instance.appendData(params);
          // appendData drifts the instance from declarative `option`, same as
          // clear(): drop dedup memory so the next shallow-equal-new-ref
          // option prop re-applies setOption to resync.
          lastAppliedRef.current = null;
        }, undefined),
    };
  }, [getInstance]);
}
