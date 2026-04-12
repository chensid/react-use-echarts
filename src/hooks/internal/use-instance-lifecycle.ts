import { useLayoutEffect } from "react";
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
import { bindEvents, unbindEvents } from "./use-events";
import { logError } from "./log-error";
import type { LastApplied } from "./types";

/**
 * Resolve theme to a registered ECharts theme name (has side effects).
 * Must only be called inside effects, not during render.
 * 将主题解析为已注册的 ECharts 主题名称（有副作用）。
 * 仅可在 effect 内部调用，不可在渲染阶段调用。
 */
function resolveThemeName(theme: string | object | null | undefined): string | null {
  if (theme == null) return null;
  if (typeof theme === "string") return theme;
  if (typeof theme === "object") return getOrRegisterCustomTheme(theme);
  return null;
}

/**
 * Internal hook: Instance lifecycle management.
 * Creates, re-creates, and destroys the ECharts instance.
 * Applies initial option, events, loading, and group on (re-)creation.
 * 内部 hook：实例生命周期管理。
 * 创建、重建、销毁 ECharts 实例，并在（重新）创建时应用初始状态。
 */
export function useInstanceLifecycle(
  ref: React.RefObject<HTMLDivElement | null>,
  shouldInit: boolean,
  themeKey: string | null,
  renderer: "canvas" | "svg",
  initOptsKey: string | null,
  // Refs for latest values (read during init, not in deps)
  optionRef: React.RefObject<EChartsOption>,
  setOptionOptsRef: React.RefObject<SetOptionOpts | undefined>,
  showLoadingRef: React.RefObject<boolean>,
  loadingOptionRef: React.RefObject<Record<string, unknown> | undefined>,
  onEventsRef: React.RefObject<EChartsEvents | undefined>,
  groupRef: React.RefObject<string | undefined>,
  onErrorRef: React.RefObject<((e: unknown) => void) | undefined>,
  themeRef: React.RefObject<UseEchartsOptions["theme"]>,
  initOptsRef: React.RefObject<EChartsInitOpts | undefined>,
  // Shared mutable refs
  lastAppliedRef: React.MutableRefObject<LastApplied | null>,
  boundEventsRef: React.MutableRefObject<EChartsEvents | undefined>,
): void {
  useLayoutEffect(() => {
    if (!shouldInit) return;

    const element = ref.current;
    if (!element) return;

    // Resolve theme: strings pass through; custom objects get registered
    // (side effect safe inside effects). Read from ref to avoid closure capture.
    const resolvedTheme = resolveThemeName(themeRef.current);

    // Re-use existing instance if another hook (or StrictMode re-mount)
    // already owns this element, avoiding a redundant init + dispose cycle.
    const existing = getCachedInstance(element);
    let instance: ECharts;
    if (existing) {
      instance = existing;
      setCachedInstance(element, existing); // bump ref count
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

    // Apply initial option
    try {
      instance.setOption(optionRef.current, setOptionOptsRef.current);
      lastAppliedRef.current = {
        option: optionRef.current,
        opts: setOptionOptsRef.current,
      };
    } catch (error) {
      logError(error, "ECharts setOption failed:", onErrorRef.current);
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
      // Reset so option sync effect re-applies option after re-init
      lastAppliedRef.current = null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable containers; only structural deps trigger re-init
  }, [shouldInit, ref, themeKey, renderer, initOptsKey]);
}
