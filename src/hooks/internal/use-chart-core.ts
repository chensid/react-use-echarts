import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as echarts from "echarts/core";
import type { ECharts, SetOptionOpts } from "echarts/core";
import type { EChartsOption } from "echarts";
import type {
  ChartFinder,
  EChartsEvents,
  EChartsFinder,
  UseEchartsOptions,
  UseEchartsReturn,
  LoadingOption,
} from "../../types";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
} from "../../utils/instance-cache";
import { updateGroup } from "../../utils/connect";
import { isBuiltinTheme, isBuiltinThemeRegistered, isKnownTheme } from "../../themes";
import { shallowEqual } from "../../utils/shallow-equal";
import { computeStableKey } from "../../utils/stable-key";
import {
  warnedThemeNames,
  warnMissingRegistration,
  warnZeroSizeContainer,
} from "../../utils/dev-warnings";
import { reportEffectError, routeImperativeError } from "../../utils/error";
import { bindEvents, bindingsMatch, unbindEvents, type BoundEvents } from "./event-utils";

/**
 * Resolve the `theme` prop to what `echarts.init` accepts: a theme name, a
 * theme object (ECharts clones it, so it is passed through unregistered), or
 * `null` for the default theme. Emits dev-only warnings for unregistered names,
 * so call it from effects only.
 * 将 theme 解析为 echarts.init 接受的值：主题名、主题对象（ECharts 会克隆，无需注册）
 * 或 null（默认主题）。会输出 dev 警告，仅在 effect 内调用。
 */
function resolveTheme(theme: string | object | undefined): string | object | null {
  // Public type forbids null, but JS callers can still pass it (typeof null is "object").
  if (theme == null) return null;
  if (typeof theme === "string") {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test" &&
      !warnedThemeNames.has(theme)
    ) {
      if (isBuiltinTheme(theme)) {
        if (!isBuiltinThemeRegistered(theme)) {
          warnedThemeNames.add(theme);
          console.warn(
            `react-use-echarts: built-in theme "${theme}" was not registered. ` +
              `Import registerBuiltinThemes() from "react-use-echarts/themes/registry" and call it once before using it ` +
              `("light" and "dark" need no registration). Unregistered themes are ignored by ECharts.`,
          );
        }
      } else if (!isKnownTheme(theme)) {
        warnedThemeNames.add(theme);
        console.warn(
          `react-use-echarts: theme "${theme}" is not built-in and this library has not seen it registered. ` +
            `If you registered it with echarts.registerTheme(), it works as-is; registerCustomTheme() does the same and silences this warning. ` +
            `Otherwise check the name for typos: ECharts ignores unregistered themes.`,
        );
      }
    }
    return theme;
  }
  return typeof theme === "object" ? theme : null;
}

// --- Types ---

interface LastApplied {
  option: EChartsOption;
  /** `computeStableKey` of the opts passed with `option`. */
  optsKey: string | null;
}

interface LastLoading {
  showLoading: boolean;
  loadingOption: LoadingOption | undefined;
}

type ChartCoreConfig = Omit<UseEchartsOptions, "lazyInit" | "autoResize">;

/**
 * Values read at call time rather than captured by an effect, synced by a
 * layout effect every render (a ref, not `useEffectEvent`: see utils/error.ts):
 *   - `onError`: routes every failure — effects via `reportEffectError`,
 *     imperative calls via `routeImperativeError`
 *   - `setOptionOpts`: merged with caller-supplied opts in imperative setOption
 *   - `onEvents`: read by the event proxies when ECharts fires (an event can
 *     fire from a consumer's render, where calling `useEffectEvent` throws)
 */
interface ImperativeLatest {
  setOptionOpts: SetOptionOpts | undefined;
  onError: ((e: unknown) => void) | undefined;
  onEvents: EChartsEvents | undefined;
}

// ECharts types convertToPixel / convertFromPixel without the third `opt` that
// the runtime and API docs accept. (`ChartFinder` likewise widens its finder
// typing with documented keys such as `calendarIndex`.)
type ConvertWithOpt = (
  this: ECharts,
  finder: ChartFinder,
  value: unknown,
  opt?: unknown,
) => number | number[];

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

  const latestRef = useRef<ImperativeLatest>(null!);
  if (latestRef.current === null) {
    latestRef.current = { setOptionOpts, onError, onEvents };
  }

  // Declared before the lifecycle effect so the first init / bind already
  // reads this commit's values. Mutated in place: never read during render.
  useLayoutEffect(() => {
    latestRef.current.setOptionOpts = setOptionOpts;
    latestRef.current.onError = onError;
    latestRef.current.onEvents = onEvents;
  });

  // --- Internal shared state ---
  // Proxies currently bound (undefined when none): Event Rebinding dedups
  // against them, and cleanup unbinds them.
  const lastBoundRef = useRef<BoundEvents | undefined>(undefined);
  // Last *attempted* inputs. Each is recorded in a `finally`, even when the
  // call throws, so a sync effect dedups a known-bad call instead of replaying
  // it and firing onError twice; a new prop value still retries.
  const lastAppliedRef = useRef<LastApplied | null>(null);
  const lastLoadingRef = useRef<LastLoading | null>(null);
  // The group this hook last assigned. Group Switch dedups against it, not the
  // runtime-writable `instance.group` (a consumer mutating that would desync
  // groupMembers), and recording it after a partial move keeps the next switch
  // from removeFromGroup-ing a stale id.
  const lastGroupRef = useRef<string | undefined>(undefined);

  // The instance this hook holds a cache reference to, set by the lifecycle
  // effect. The sync effects and imperative methods act only through it: on an
  // element another hook also uses, the cached instance isn't ours until our
  // own lifecycle effect has acquired it (a deferred lazyInit hook must not
  // write to, bind on, or group someone else's chart). A ref, so the methods
  // work in the gap before `liveInstance` commits.
  const ownedRef = useRef<ECharts | undefined>(undefined);
  // Reactive instance for consumers' `useEffect([instance])`.
  const [liveInstance, setLiveInstance] = useState<ECharts | undefined>(undefined);

  // Memoized by hand: React Compiler skips this hook (it bails on the
  // eslint-disabled effect deps below), so object theme / initOpts would
  // otherwise be re-stringified every render.
  const themeKey = useMemo(() => computeStableKey(theme), [theme]);
  const initOptsKey = useMemo(() => computeStableKey(initOpts), [initOpts]);
  // By value, not shallow: `replaceMerge` / `transition` nest, so an inline
  // wrapper would never compare equal and setOption would re-run every render.
  const setOptionOptsKey = useMemo(() => computeStableKey(setOptionOpts), [setOptionOpts]);

  // =====================================================================
  // INSTANCE LIFECYCLE (init / recreate / cleanup)
  //
  // A theme / renderer / initOpts change disposes the instance and creates a
  // new one, re-applying all state (option, events, loading, group).
  //
  // Theme changes recreate rather than call ECharts 6 `setTheme()`: its docs
  // warn that after several merge-mode `setOption` calls it rebuilds from the
  // first option backup unless every call used `notMerge`. This library merges
  // by default, so the chart would snap back to stale data.
  // =====================================================================
  useLayoutEffect(() => {
    if (!shouldInit || !element) return;

    warnZeroSizeContainer(element);

    const resolvedTheme = resolveTheme(theme);

    let instance = getCachedInstance(element);
    if (instance) {
      if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
        console.warn(
          "react-use-echarts: multiple hooks share the same DOM element. " +
            "The shared instance is reused; theme/renderer/initOpts changes from later hooks are ignored, " +
            "and option/events/loading/group writes from later hooks overwrite earlier ones.",
        );
      }
    } else {
      try {
        instance = echarts.init(element, resolvedTheme, {
          renderer,
          ...initOpts,
        });
      } catch (error) {
        warnMissingRegistration(error);
        reportEffectError(error, latestRef.current.onError, "ECharts init failed:");
        return;
      }
    }
    const owned = setCachedInstance(element, instance);
    ownedRef.current = owned;

    const cleanup = () => {
      ownedRef.current = undefined;
      lastAppliedRef.current = null;
      lastLoadingRef.current = null;
      setLiveInstance(undefined);

      // Release must run on unmount or the instance leaks. Neither off() nor
      // dispose throws on real ECharts; the guards keep a misbehaving one from
      // skipping release or disrupting React's commit.
      try {
        try {
          unbindEvents(owned, lastBoundRef.current);
        } catch (error) {
          reportEffectError(error, latestRef.current.onError, "ECharts event unbind failed:");
        }
      } finally {
        lastBoundRef.current = undefined;
        try {
          releaseCachedInstance(element);
        } catch (error) {
          reportEffectError(error, latestRef.current.onError, "ECharts release failed:");
        }
      }
    };

    // Each stage reports its own failure, but an onError that rethrows still
    // exits the effect, and React keeps no cleanup for an effect that threw:
    // release here before passing the error on, or the instance leaks.
    try {
      try {
        owned.setOption(option, setOptionOpts);
      } catch (error) {
        reportEffectError(error, latestRef.current.onError, "ECharts setOption failed:");
      } finally {
        lastAppliedRef.current = { option, optsKey: setOptionOptsKey };
      }

      // showLoading can throw via user-registered custom loading types.
      try {
        if (showLoading) {
          owned.showLoading(loadingOption);
        }
      } catch (error) {
        reportEffectError(error, latestRef.current.onError, "ECharts loading toggle failed:");
      } finally {
        lastLoadingRef.current = { showLoading, loadingOption };
      }

      const bound: BoundEvents = new Map();
      lastBoundRef.current = bound;
      try {
        bindEvents(owned, onEvents, latestRef, bound);
      } catch (error) {
        reportEffectError(error, latestRef.current.onError, "ECharts event bind failed:");
      }

      try {
        updateGroup(owned, undefined, group);
      } catch (error) {
        reportEffectError(error, latestRef.current.onError, "ECharts group assignment failed:");
      } finally {
        // Record even `undefined`: Group Switch dedups against it.
        lastGroupRef.current = group;
      }
    } catch (error) {
      cleanup();
      throw error;
    }

    setLiveInstance(owned);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- non-structural config is captured at init; the sync effects below apply its changes
  }, [shouldInit, element, themeKey, renderer, initOptsKey]);

  // =====================================================================
  // OPTION SYNC
  //
  // Re-applies only on a real prop change: a new `option` reference (always —
  // shallow comparison can't see nested data the caller mutated before cloning
  // the wrapper) or a changed `setOptionOpts` value. An unrelated render thus
  // never overwrites an imperative setOption / clear / appendData; the next
  // real prop change wins. lastAppliedRef skips the run right after init.
  // =====================================================================
  useEffect(() => {
    const instance = ownedRef.current;
    if (!instance) return;

    const last = lastAppliedRef.current;
    if (last?.option === option && last.optsKey === setOptionOptsKey) return;

    try {
      instance.setOption(option, setOptionOpts);
    } catch (error) {
      reportEffectError(error, latestRef.current.onError, "ECharts setOption failed:");
    } finally {
      lastAppliedRef.current = { option, optsKey: setOptionOptsKey };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOptionOptsKey stands in for setOptionOpts (compared by value)
  }, [element, option, setOptionOptsKey]);

  // =====================================================================
  // EVENT REBINDING
  //
  // Handlers are reached through per-event proxies that read the latest
  // `onEvents` at call time, so a changed handler reference needs no work.
  // Only a structural change — event names, a `query` (shallow), or a
  // `context` — unbinds the old proxies and binds new ones.
  // =====================================================================
  useEffect(() => {
    const instance = ownedRef.current;
    if (!instance) return;

    if (bindingsMatch(lastBoundRef.current, onEvents)) return;

    // off() is bare here (no try/catch): zrender Eventful.off is a filter loop
    // that cannot throw on a real instance, and we don't track failed unbinds
    // for retry. If ECharts ever broke that invariant, the throw surfaces
    // instead of silently leaking an old listener.
    unbindEvents(instance, lastBoundRef.current);
    const bound: BoundEvents = new Map();
    lastBoundRef.current = bound;
    try {
      bindEvents(instance, onEvents, latestRef, bound);
    } catch (error) {
      reportEffectError(error, latestRef.current.onError, "ECharts event bind failed:");
    }
  }, [element, onEvents]);

  // =====================================================================
  // LOADING TOGGLE
  //
  // showLoading / hideLoading on dynamic changes (init applies the initial
  // state); shallowEqual dedups inline loadingOption objects.
  // =====================================================================
  useEffect(() => {
    const instance = ownedRef.current;
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
      reportEffectError(error, latestRef.current.onError, "ECharts loading toggle failed:");
    } finally {
      lastLoadingRef.current = { showLoading, loadingOption };
    }
  }, [element, showLoading, loadingOption]);

  // =====================================================================
  // GROUP SWITCH — dynamic group changes (init assigns the initial group).
  // =====================================================================
  useEffect(() => {
    const instance = ownedRef.current;
    if (!instance) return;

    const currentGroup = lastGroupRef.current;
    if (currentGroup === group) return;

    try {
      updateGroup(instance, currentGroup, group);
    } catch (error) {
      reportEffectError(error, latestRef.current.onError, "ECharts group switch failed:");
    } finally {
      lastGroupRef.current = group;
    }
  }, [element, group]);

  // =====================================================================
  // IMPERATIVE API
  //
  // No instance → fallback (undefined / true / false). When the instance
  // throws: with onError, route the error and return the fallback; without
  // onError, rethrow. clear() / appendData() drop lastAppliedRef so the next
  // real prop change re-applies the option.
  //
  // useMemo keeps method identities stable, so consumer effects with
  // `[chart.setOption]` deps don't thrash (React Compiler doesn't memoize this
  // hook). Every method reads refs at call time, so there are no deps.
  // =====================================================================
  const api = useMemo(() => {
    const withInstance = <T>(fn: (instance: ECharts) => T, fallback: T): T => {
      const instance = ownedRef.current;
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
          const declaredOpts = latestRef.current.setOptionOpts;
          const finalOpts = { ...declaredOpts, ...opts };
          instance.setOption(newOption, finalOpts);
          // Track what's on the instance, so the next real prop change
          // re-applies the declarative option. Without per-call opts, key the
          // declared opts exactly as Option Sync does (unset → null, not "{}"),
          // or its dedup could never match.
          lastAppliedRef.current = {
            option: newOption,
            optsKey: computeStableKey(opts ? finalOpts : declaredOpts),
          };
        }, undefined),

      dispatchAction: (payload, opt) =>
        withInstance((instance) => instance.dispatchAction(payload, opt), undefined),

      clear: () =>
        withInstance((instance) => {
          instance.clear();
          // The instance is blank now, so Option Sync must not skip the next
          // real prop change (e.g. a prop moving to the object an earlier
          // imperative setOption recorded).
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
      // ECharts 6.1.0 reads `opts.type` without defaulting `opts` (fixed on its
      // release branch, apache/echarts#21736), so a no-argument call threw.
      getConnectedDataURL: (opts) =>
        withInstance((instance) => instance.getConnectedDataURL(opts ?? {}), undefined),
      renderToSVGString: (opts) =>
        withInstance((instance) => instance.renderToSVGString(opts), undefined),
      getSvgDataURL: () => withInstance((instance) => instance.getSvgDataURL(), undefined),
      convertToPixel: (finder, value, opt) =>
        withInstance(
          (instance) =>
            (instance.convertToPixel as ConvertWithOpt).call(instance, finder, value, opt),
          undefined,
        ),
      convertToLayout: (finder, value, opt) =>
        withInstance(
          (instance) => instance.convertToLayout(finder as EChartsFinder, value, opt),
          undefined,
        ),
      convertFromPixel: (finder, value, opt) =>
        withInstance(
          (instance) =>
            (instance.convertFromPixel as ConvertWithOpt).call(instance, finder, value, opt),
          undefined,
        ),
      containPixel: (finder, value) =>
        withInstance((instance) => instance.containPixel(finder as EChartsFinder, value), false),
      appendData: (params) =>
        withInstance((instance) => {
          instance.appendData(params);
          // Drifted from `option`, like clear().
          lastAppliedRef.current = null;
        }, undefined),
    } satisfies Omit<ChartCoreReturn, "instance">;
  }, []);

  // Re-created only on init or dispose, so consumers spreading the result keep
  // stable method identities across unrelated renders.
  return useMemo<ChartCoreReturn>(() => ({ instance: liveInstance, ...api }), [liveInstance, api]);
}
