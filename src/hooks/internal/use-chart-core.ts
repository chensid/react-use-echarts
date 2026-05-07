import { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption, Payload } from "echarts";
import type { EChartsEvents, EChartsInitOpts, UseEchartsOptions, LoadingOption } from "../../types";
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
import { computeStableKey, isCircularFallbackKey } from "../../utils/stable-key";
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
 */
function resolveThemeName(
  theme: string | object | undefined,
  themeKey: string | null,
): string | null {
  // Public type forbids null, but JS callers can still pass it. typeof null
  // is "object" so without this guard we'd hit getOrRegisterCustomTheme(null)
  // and throw inside the WeakMap path — outside Effect 1's init try/catch.
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
  const contentHash = themeKey && !isCircularFallbackKey(themeKey) ? themeKey : undefined;
  return getOrRegisterCustomTheme(theme, contentHash);
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

interface ChartCoreReturn {
  getInstance: () => ECharts | undefined;
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  dispatchAction: (
    payload: Payload,
    opt?: boolean | { silent?: boolean; flush?: boolean | undefined },
  ) => void;
  clear: () => void;
  resize: () => void;
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
  // Adding a field to LatestConfig forces it to appear in both the initializer
  // and the sync layout effect below — TS catches stale-config drift at compile time.
  // Lazy-init pattern (`null!` + first-render assign) avoids re-evaluating the
  // 10-field literal on every render — `useRef`'s argument is only used once.
  // Constraint: nothing may read `latestRef.current` before the if-block runs.
  const latestRef = useRef<LatestConfig>(null!);
  if (latestRef.current === null) {
    latestRef.current = {
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
    };
  }

  useLayoutEffect(() => {
    latestRef.current = {
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
    };
  });

  // --- Internal shared state ---
  // Event maps for which bindEvents() has been attempted but unbindEvents()
  // has not yet successfully completed. Typically holds one entry (the
  // currently bound events), but grows when an unbind attempt fails so
  // cleanup can retry and avoid leaking handlers. The tail entry is treated
  // as the current declared intent for dedup against new prop values.
  const pendingUnbindRef = useRef<EChartsEvents[]>([]);
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

  const setOption = useCallback(
    (newOption: EChartsOption, opts?: SetOptionOpts) => {
      const instance = getInstance();
      if (!instance) return;
      const finalOpts = { ...latestRef.current.setOptionOpts, ...opts };
      try {
        instance.setOption(newOption, finalOpts);
        // Keep lastAppliedRef in sync so prop-driven Effect 2 dedup reflects
        // what's actually on the instance, not what props last sent.
        lastAppliedRef.current = { option: newOption, opts: finalOpts };
      } catch (error) {
        routeImperativeError(error, latestRef.current.onError);
      }
    },
    [getInstance],
  );

  const dispatchAction = useCallback(
    (payload: Payload, opt?: boolean | { silent?: boolean; flush?: boolean | undefined }) => {
      const instance = getInstance();
      if (!instance) return;
      try {
        instance.dispatchAction(payload, opt);
      } catch (error) {
        routeImperativeError(error, latestRef.current.onError);
      }
    },
    [getInstance],
  );

  const clear = useCallback(() => {
    const instance = getInstance();
    if (!instance) return;
    try {
      instance.clear();
    } catch (error) {
      routeImperativeError(error, latestRef.current.onError);
    }
  }, [getInstance]);

  const resize = useCallback(() => {
    const instance = getInstance();
    if (!instance) return;
    try {
      instance.resize();
    } catch (error) {
      routeImperativeError(error, latestRef.current.onError);
    }
  }, [getInstance]);

  // =====================================================================
  // Effect 1: INSTANCE LIFECYCLE (init / recreate / cleanup)
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

    try {
      if (latest.showLoading) {
        instance.showLoading(latest.loadingOption);
      }
      lastLoadingRef.current = {
        showLoading: latest.showLoading,
        loadingOption: latest.loadingOption,
      };
    } catch (error) {
      routeEffectError(error, "ECharts loading toggle failed:", latest.onError);
    }

    // Track for cleanup regardless of partial bind failure so off() can be
    // attempted on any handlers that did get bound (off is tolerant of
    // unknown handlers).
    pendingUnbindRef.current = latest.onEvents ? [latest.onEvents] : [];
    try {
      bindEvents(instance, latest.onEvents);
    } catch (error) {
      routeEffectError(error, "ECharts event bind failed:", latest.onError);
    }

    if (latest.group) {
      try {
        updateGroup(instance, undefined, latest.group);
      } catch (error) {
        routeEffectError(error, "ECharts group switch failed:", latest.onError);
      }
    }

    return () => {
      lastAppliedRef.current = null;
      lastLoadingRef.current = null;

      const inst = getCachedInstance(element);
      if (!inst) return;

      // releaseCachedInstance must always run (refCount/dispose/group cleanup);
      // walk every pending entry so handlers from previous failed unbinds
      // get one more chance, and let `finally` guarantee the release lands
      // even if the user's onError callback itself throws.
      try {
        for (const entry of pendingUnbindRef.current) {
          try {
            unbindEvents(inst, entry);
          } catch (error) {
            routeEffectError(error, "ECharts event unbind failed:", latestRef.current.onError);
          }
        }
      } finally {
        pendingUnbindRef.current = [];
        // Release can now throw (instance-cache propagates leaveGroup/dispose
        // failures to the caller). Route it like any other effect-side error
        // so the React commit isn't disrupted at unmount.
        try {
          releaseCachedInstance(element);
        } catch (error) {
          routeEffectError(error, "ECharts release failed:", latestRef.current.onError);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latest config values are read from refs; only structural deps trigger re-init
  }, [shouldInit, element, themeKey, renderer, initOptsKey]);

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
      routeEffectError(error, "ECharts setOption failed:", latestRef.current.onError);
    }
  }, [getInstance, option, setOptionOpts]);

  // =====================================================================
  // Effect 3: EVENT REBINDING
  //
  // When onEvents reference changes, unbind old and bind new handlers.
  // Uses pendingUnbindRef to track entries pending cleanup; the tail entry
  // is treated as the current declared intent for dedup.
  // =====================================================================
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const pending = pendingUnbindRef.current;
    const lastIntent = pending[pending.length - 1];
    if (eventsEqual(lastIntent, onEvents)) return;

    // Semantic match — handler/query/context all equal — rather than just
    // reference identity, so an inline event map that's a fresh object but
    // describes the same bindings still gets recognized as already-bound.
    const alreadyPending =
      onEvents !== undefined && pending.some((entry) => eventsEqual(entry, onEvents));

    // Order matters: ECharts `off(name, handler)` matches by handler reference
    // and ignores query/context, so a same-handler rebind (query A → query B)
    // must unbind the old binding BEFORE the new one is registered — otherwise
    // the off call would remove the freshly-bound handler too.
    const stillPending: EChartsEvents[] = [];
    for (const prev of pending) {
      // Skip entries semantically equivalent to onEvents — their handlers
      // remain bound and are carried forward via the onEvents entry pushed
      // at the tail below.
      if (eventsEqual(prev, onEvents)) continue;
      try {
        unbindEvents(instance, prev);
      } catch (error) {
        routeEffectError(error, "ECharts event unbind failed:", latestRef.current.onError);
        stillPending.push(prev);
      }
    }

    if (onEvents && !alreadyPending) {
      try {
        bindEvents(instance, onEvents);
      } catch (error) {
        routeEffectError(error, "ECharts event bind failed:", latestRef.current.onError);
      }
    }

    if (onEvents) stillPending.push(onEvents);
    pendingUnbindRef.current = stillPending;
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

    try {
      if (showLoading) {
        instance.showLoading(loadingOption);
      } else {
        instance.hideLoading();
      }
      lastLoadingRef.current = { showLoading, loadingOption };
    } catch (error) {
      routeEffectError(error, "ECharts loading toggle failed:", latestRef.current.onError);
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

    try {
      updateGroup(instance, currentGroup, group);
    } catch (error) {
      routeEffectError(error, "ECharts group switch failed:", latestRef.current.onError);
    }
  }, [getInstance, group]);

  return useMemo(
    () => ({ getInstance, setOption, dispatchAction, clear, resize }),
    [getInstance, setOption, dispatchAction, clear, resize],
  );
}
