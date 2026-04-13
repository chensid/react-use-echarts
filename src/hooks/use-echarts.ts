import { useCallback, useMemo } from "react";
import type { UseEchartsOptions, UseEchartsReturn } from "../types";
import { useLazyInit } from "./use-lazy-init";
import { useChartCore } from "./internal/use-chart-core";
import { useResizeObserver } from "./internal/use-resize-observer";

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

  const shouldInit = useLazyInit(ref, lazyInit);

  // Core: instance lifecycle + option sync + events + loading + group (5 effects)
  const { getInstance, setOption } = useChartCore(ref, shouldInit, {
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

  useResizeObserver(ref, autoResize);

  const resize = useCallback(() => {
    getInstance()?.resize();
  }, [getInstance]);

  return useMemo(() => ({ setOption, getInstance, resize }), [setOption, getInstance, resize]);
}

export default useEcharts;
