import { useEffect, useEffectEvent, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as echarts from "echarts/core";
import type { ECharts, SetOptionOpts } from "echarts/core";
import type { EChartsOption } from "echarts";
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
import { routeImperativeError } from "../../utils/error";
import { bindEvents, unbindEvents, eventsEqual } from "./event-utils";

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用，仅可在 effect 内调用）。
 *
 * @param themeKey Pre-computed key from computeStableKey — passed as contentHash
 *   to avoid redundant JSON.stringify inside getOrRegisterCustomTheme.
 *   `null` only for nullish theme; object themes always get a non-null key
 *   (JSON string or per-reference id), so the object branch below can assert it.
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
  // computeStableKey returns non-null for any object (JSON string or per-ref
  // fallback id), so themeKey is guaranteed populated on this branch.
  return getOrRegisterCustomTheme(theme, themeKey!);
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
 * Fields read by the imperative API (`withInstance` closure, created inside
 * the `useMemo([element])` block that produces the API surface).
 * `useEffectEvent` is forbidden outside Effects, so the imperative path keeps
 * a ref-sync bridge for the two values it needs:
 *   - `onError`: routed via `routeImperativeError` on imperative throws
 *   - `setOptionOpts`: merged with caller-supplied opts in imperative setOption
 * Effect-context error routing uses `useEffectEvent` directly — no ref needed.
 */
interface ImperativeLatest {
  setOptionOpts: SetOptionOpts | undefined;
  onError: ((e: unknown) => void) | undefined;
}

// `ref` is owned by the outer `useEcharts` (callback-ref + cleanup lives
// there); useChartCore returns everything else from the public surface.
type ChartCoreReturn = Omit<UseEchartsReturn, "ref">;

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

  // --- Imperative-only latest ref: 2 fields used by `withInstance` (created
  // inside the `useMemo([element])` API block, NOT an effect). `useEffectEvent`
  // cannot be called outside Effects, so the imperative path still needs a
  // ref-sync bridge. All other config fields are either reactive deps in
  // their owning effect or captured via closure inside the lifecycle effect.
  const latestRef = useRef<ImperativeLatest>(null!);
  if (latestRef.current === null) {
    latestRef.current = { setOptionOpts, onError };
  }

  useLayoutEffect(() => {
    latestRef.current = { setOptionOpts, onError };
  });

  // --- Effect-context error routing. `useEffectEvent` reads the latest
  // `onError` at call time without re-triggering enclosing effects, replacing
  // the React 18-era `latestRef.current.onError` ping-pong. Only callable
  // from within Effects — imperative API path uses `latestRef` instead.
  const handleEffectError = useEffectEvent((error: unknown, message: string) => {
    if (onError) onError(error);
    else console.error(message, error);
  });

  // --- Internal shared state ---
  // Event map currently bound to the instance (undefined when none bound).
  // Used by Event Rebinding effect to dedup and unbind on prop changes.
  const lastBoundRef = useRef<EChartsEvents | undefined>(undefined);
  const lastAppliedRef = useRef<LastApplied | null>(null);
  const lastLoadingRef = useRef<LastLoading | null>(null);

  // Reactive view of the current instance. Set inside the lifecycle effect
  // after init/share succeeds and cleared on cleanup, so downstream consumers
  // can subscribe via `useEffect([instance])`. Imperative methods do NOT
  // depend on this state — they read from `getCachedInstance(element)` so
  // they remain callable in the layout-effect → render-commit gap before
  // React reconciles this state update.
  const [liveInstance, setLiveInstance] = useState<ECharts | undefined>(undefined);

  // --- Stable dependency keys, memoized on the raw input reference. React
  // Compiler skips this whole hook because it disables a react-hooks ESLint
  // rule (the trimmed lifecycle-effect deps below) — the compiler bails on any
  // function that opts out of its rules. So it won't auto-memoize these calls;
  // without an explicit useMemo, computeStableKey would re-run JSON.stringify
  // every render for object theme / initOpts (the stable-ref usage CLAUDE.md
  // recommends). No regression for inline objects — the dep changes either way.
  const themeKey = useMemo(() => computeStableKey(theme), [theme]);
  const initOptsKey = useMemo(() => computeStableKey(initOpts), [initOpts]);

  // --- Public API ---

  const lookupInstance = (): ECharts | undefined => {
    if (!element) return undefined;
    return getCachedInstance(element);
  };

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

    const resolvedTheme = resolveThemeName(theme, themeKey);

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
          ...initOpts,
        });
      } catch (error) {
        handleEffectError(error, "ECharts init failed:");
        return;
      }
      setCachedInstance(element, instance);
    }

    try {
      instance.setOption(option, setOptionOpts);
    } catch (error) {
      handleEffectError(error, "ECharts setOption failed:");
    } finally {
      // Record the attempt regardless of success: a throw here means the
      // option is malformed. Option-Sync's useEffect runs immediately after
      // this layout effect on the SAME mount, and without a recorded "last
      // attempt" it would re-invoke setOption with the same args and fire
      // onError a second time. The user can still recover by passing a new
      // option reference (Option-Sync sees the changed ref and retries).
      lastAppliedRef.current = { option, opts: setOptionOpts };
    }

    // showLoading can throw via user-registered custom loading types.
    try {
      if (showLoading) {
        instance.showLoading(loadingOption);
      }
    } catch (error) {
      handleEffectError(error, "ECharts loading toggle failed:");
    } finally {
      // Mirror the setOption pattern above: record the attempt unconditionally
      // so Loading-Toggle's useEffect (also fires on the same mount) dedups
      // against this attempt instead of re-invoking showLoading and
      // double-reporting the failure.
      lastLoadingRef.current = { showLoading, loadingOption };
    }

    // Track for cleanup regardless of partial bind failure so off() can still
    // be attempted on any handlers that did get bound.
    lastBoundRef.current = onEvents;
    try {
      bindEvents(instance, onEvents);
    } catch (error) {
      handleEffectError(error, "ECharts event bind failed:");
    }

    if (group) {
      updateGroup(instance, undefined, group);
    }

    setLiveInstance(instance);

    return () => {
      lastAppliedRef.current = null;
      lastLoadingRef.current = null;
      setLiveInstance(undefined);

      const inst = getCachedInstance(element);
      if (!inst) return;

      // Cleanup correctness is critical: release MUST run on unmount or the
      // instance leaks. unbind itself doesn't throw on real ECharts (zrender
      // Eventful.off is a filter loop), and the same is true for dispose, but
      // try/catch + try/finally guards against either misbehaving and ensures
      // an effect-cleanup throw never disrupts React commit.
      try {
        try {
          unbindEvents(inst, lastBoundRef.current);
        } catch (error) {
          handleEffectError(error, "ECharts event unbind failed:");
        }
      } finally {
        lastBoundRef.current = undefined;
        try {
          releaseCachedInstance(element);
        } catch (error) {
          handleEffectError(error, "ECharts release failed:");
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- non-structural deps (option/setOptionOpts/showLoading/loadingOption/onEvents/group) captured at init; updates handled by dedicated sync effects below
  }, [shouldInit, element, themeKey, renderer, initOptsKey]);

  // =====================================================================
  // OPTION SYNC
  //
  // Uses lastAppliedRef to skip the first run after the lifecycle effect
  // (which already applied the same option). shallowEqual prevents
  // unnecessary setOption when user creates new wrapper objects.
  // =====================================================================
  useEffect(() => {
    if (!element) return;
    const instance = getCachedInstance(element);
    if (!instance) return;

    const last = lastAppliedRef.current;
    if (last) {
      // Fast path: identical refs skip shallowEqual's typeof/keys dispatch
      if (last.option === option && last.opts === setOptionOpts) return;
      if (shallowEqual(last.option, option) && shallowEqual(last.opts, setOptionOpts)) return;
    }

    try {
      instance.setOption(option, setOptionOpts);
    } catch (error) {
      handleEffectError(error, "ECharts setOption failed:");
    } finally {
      // Record the attempt even on failure so a subsequent rerender with
      // the same option ref dedups via the fast path above instead of
      // re-throwing identically.
      lastAppliedRef.current = { option, opts: setOptionOpts };
    }
  }, [element, option, setOptionOpts]);

  // =====================================================================
  // EVENT REBINDING
  //
  // When onEvents reference changes, unbind old and bind new handlers.
  // Uses lastBoundRef to dedup against the currently-bound map.
  // =====================================================================
  useEffect(() => {
    if (!element) return;
    const instance = getCachedInstance(element);
    if (!instance) return;

    if (eventsEqual(lastBoundRef.current, onEvents)) return;

    // Order matters: ECharts `off(name, handler)` matches by handler reference
    // and ignores query/context, so a same-handler rebind (query A → query B)
    // must unbind the old binding BEFORE the new one is registered — otherwise
    // the off call would remove the freshly-bound handler too.
    //
    // off() is bare here (no try/catch): zrender Eventful.off is a filter loop
    // that cannot throw on a real instance. Adding a single-handler "current"
    // ref + try/catch route would imply we tracked failed unbinds and retried
    // them — which we deliberately don't (would require the queue this module
    // removed). Leaving off() bare keeps the contract honest: if ECharts
    // somehow broke this invariant, the rebind effect surfaces the throw
    // instead of silently leaking an old listener.
    unbindEvents(instance, lastBoundRef.current);
    try {
      bindEvents(instance, onEvents);
    } catch (error) {
      handleEffectError(error, "ECharts event bind failed:");
    }
    lastBoundRef.current = onEvents;
  }, [element, onEvents]);

  // =====================================================================
  // LOADING TOGGLE
  //
  // Toggles showLoading / hideLoading on dynamic changes.
  // Lifecycle effect handles initial application on instance creation;
  // lastLoadingRef + shallowEqual skips redundant calls for inline
  // loadingOption objects with identical content.
  // =====================================================================
  useEffect(() => {
    if (!element) return;
    const instance = getCachedInstance(element);
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
    } catch (error) {
      handleEffectError(error, "ECharts loading toggle failed:");
    } finally {
      // Record the attempt even on failure so a rerender with the same
      // (showLoading, loadingOption) pair dedups instead of re-firing.
      lastLoadingRef.current = { showLoading, loadingOption };
    }
  }, [element, showLoading, loadingOption]);

  // =====================================================================
  // GROUP SWITCH
  //
  // Switches chart group membership on dynamic changes.
  // Lifecycle effect handles initial group assignment on instance creation.
  // =====================================================================
  useEffect(() => {
    if (!element) return;
    const instance = getCachedInstance(element);
    if (!instance) return;

    const currentGroup = getInstanceGroup(instance);
    if (currentGroup === group) return;

    updateGroup(instance, currentGroup, group);
  }, [element, group]);

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
  //
  // Wrapped in `useMemo([element])` so method identities stay stable across
  // renders for a given container. Mutables (lastAppliedRef, latestRef) are
  // read live; only `element` changes invalidate the closures. Without this
  // memo, consumer effects with `[chart.setOption]` deps would thrash on
  // every render (React Compiler does not memoize this hook's return).
  // =====================================================================
  const api = useMemo(() => {
    const withInstance = <T>(fn: (instance: ECharts) => T, fallback: T): T => {
      const instance = lookupInstance();
      if (!instance) return fallback;
      try {
        return fn(instance);
      } catch (error) {
        routeImperativeError(error, latestRef.current.onError);
        return fallback;
      }
    };

    return {
      setOption: (newOption: EChartsOption, opts?: SetOptionOpts) =>
        withInstance((instance) => {
          const finalOpts = { ...latestRef.current.setOptionOpts, ...opts };
          instance.setOption(newOption, finalOpts);
          // Keep lastAppliedRef in sync so prop-driven Option-Sync Effect dedup
          // reflects what's actually on the instance, not what props last sent.
          lastAppliedRef.current = { option: newOption, opts: finalOpts };
        }, undefined),

      dispatchAction: ((payload, opt) =>
        withInstance(
          (instance) => instance.dispatchAction(payload, opt),
          undefined,
        )) as ChartCoreReturn["dispatchAction"],

      clear: () =>
        withInstance((instance) => {
          instance.clear();
          // Drop dedup memory: instance is now blank, so a subsequent prop
          // rerender with a shallow-equal-but-new option ref must re-apply
          // it instead of being skipped by Option-Sync Effect's fast path.
          lastAppliedRef.current = null;
        }, undefined),

      resize: ((opts) =>
        withInstance((instance) => instance.resize(opts), undefined)) as ChartCoreReturn["resize"],

      getOption: () => withInstance((instance) => instance.getOption() as EChartsOption, undefined),
      getWidth: () => withInstance((instance) => instance.getWidth(), undefined),
      getHeight: () => withInstance((instance) => instance.getHeight(), undefined),
      getDom: () => withInstance((instance) => instance.getDom(), undefined),
      // No instance → semantically disposed. Errors still route via withInstance,
      // falling back to true so consumers don't act on a half-broken instance.
      isDisposed: () => withInstance((instance) => instance.isDisposed(), true),
      getDataURL: ((opts) =>
        withInstance(
          (instance) => instance.getDataURL(opts),
          undefined,
        )) as ChartCoreReturn["getDataURL"],
      getConnectedDataURL: ((opts) =>
        withInstance(
          (instance) => instance.getConnectedDataURL(opts),
          undefined,
        )) as ChartCoreReturn["getConnectedDataURL"],
      renderToSVGString: ((opts) =>
        withInstance(
          (instance) => instance.renderToSVGString(opts),
          undefined,
        )) as ChartCoreReturn["renderToSVGString"],
      getSvgDataURL: () => withInstance((instance) => instance.getSvgDataURL(), undefined),
      // ECharts' convertToPixel/convertFromPixel are overloaded; passing through
      // the public widened signature requires `as never` to satisfy the
      // last-overload-only inference TypeScript performs on overloaded methods.
      convertToPixel: ((finder, value) =>
        withInstance(
          (instance) => instance.convertToPixel(finder as never, value as never),
          undefined,
        )) as ChartCoreReturn["convertToPixel"],
      convertFromPixel: ((finder, value) =>
        withInstance(
          (instance) => instance.convertFromPixel(finder as never, value as never),
          undefined,
        )) as ChartCoreReturn["convertFromPixel"],
      containPixel: ((finder, value) =>
        withInstance(
          (instance) => instance.containPixel(finder, value),
          false,
        )) as ChartCoreReturn["containPixel"],
      appendData: ((params) =>
        withInstance((instance) => {
          instance.appendData(params);
          // appendData drifts the instance from declarative `option`, same as
          // clear(): drop dedup memory so the next shallow-equal-new-ref
          // option prop re-applies setOption to resync.
          lastAppliedRef.current = null;
        }, undefined)) as ChartCoreReturn["appendData"],
    } satisfies Omit<ChartCoreReturn, "instance">;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lastAppliedRef / latestRef are refs; closures read them live. lookupInstance closes over `element`, so [element] is the full dep set.
  }, [element]);

  // Merge reactive `instance` into the stable api block. The wrapping object
  // identity is re-cached only when liveInstance or api changes (i.e. on init,
  // dispose, or element swap), so consumers spreading the hook result keep
  // stable method identities across unrelated renders.
  return useMemo<ChartCoreReturn>(() => ({ instance: liveInstance, ...api }), [liveInstance, api]);
}
