import { useCallback, useMemo, type RefObject } from "react";
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

  // Core: instance lifecycle + option sync + events + loading + group (1 useLayoutEffect + 4 useEffect)
  const { getInstance, setOption, dispatchAction, clear } = useChartCore(element, shouldInit, {
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

  const resize = useCallback(() => {
    getInstance()?.resize();
  }, [getInstance]);

  return useMemo(
    () => ({ setOption, getInstance, resize, dispatchAction, clear }),
    [setOption, getInstance, resize, dispatchAction, clear],
  );
}

export default useEcharts;
