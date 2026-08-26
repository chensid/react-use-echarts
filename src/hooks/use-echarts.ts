import { useCallback, useMemo, useState } from "react";
import type { UseEchartsOptions, UseEchartsReturn } from "../types";
import { useLazyInitForElement } from "./use-lazy-init";
import { useChartCore } from "./internal/use-chart-core";
import { useResizeObserver } from "./internal/use-resize-observer";

/**
 * React hook for Apache ECharts integration
 * Apache ECharts React Hook
 *
 * Returns a callback ref to attach to the container element, plus a
 * reactive `instance` field and the imperative chart API.
 *
 * @example
 * ```tsx
 * const { ref, instance, setOption } = useEcharts({ option });
 * return <div ref={ref} style={{ width: 600, height: 400 }} />;
 * ```
 */
export function useEcharts(options: UseEchartsOptions): UseEchartsReturn {
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

  // React 19 callback ref with cleanup: receives the node on mount, the
  // returned cleanup runs on unmount (or before the next ref-callback
  // invocation when the node is replaced). The stable `useCallback`
  // identity prevents the cleanup/re-invoke from firing on every render.
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
    return () => setElement(null);
  }, []);

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

  // `useChartCore` already hands back a memoized object, and `ref` is a stable
  // `useCallback`. Spreading them into a bare literal would throw that away and
  // hand callers a new identity every render — enough to re-run a consumer's
  // `useImperativeHandle`/effect deps on every render. React Compiler cannot
  // compile this hook at all: the destructuring defaults above (`renderer =
  // "canvas"`, …) hit a `BuildHIR::lowerAssignment` bail in
  // babel-plugin-react-compiler 1.0.0. Keep this `useMemo` even if a future
  // compiler starts emitting a cache here — the stability test depends on it.
  return useMemo(() => ({ ref, ...chart }), [ref, chart]);
}
