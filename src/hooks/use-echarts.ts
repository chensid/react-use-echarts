import { type RefObject } from "react";
import type { UseEchartsOptions, UseEchartsReturn } from "../types";
import { useLazyInitForElement } from "./use-lazy-init";
import { useChartCore } from "./internal/use-chart-core";
import { useResizeObserver } from "./internal/use-resize-observer";
import { useRefElement } from "./internal/use-ref-element";

/**
 * React hook for Apache ECharts integration
 * Apache ECharts React Hook
 *
 * @param ref React ref to the chart container element
 * @param options Configuration options
 * @returns Chart control methods
 */
function useEcharts(
  ref: RefObject<HTMLDivElement | null>,
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

  const element = useRefElement(ref);
  const shouldInit = useLazyInitForElement(element, lazyInit);

  // Core owns all instance IO — including the imperative resize/clear methods
  // — so error routing through onError lives in one module.
  const chart = useChartCore(element, shouldInit, {
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

  useResizeObserver(element, autoResize, onError);

  return chart;
}

export default useEcharts;
