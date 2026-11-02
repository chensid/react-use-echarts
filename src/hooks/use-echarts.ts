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
  // Named reads, not `...rest`: a rest copy keeps only own enumerable keys, so
  // getter-backed or inherited options would never reach the core.
  const { lazyInit, autoResize = true, onError } = options;

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

  const chart = useChartCore(element, shouldInit, options);
  useResizeObserver(element, autoResize, onError);

  // `useChartCore` already returns a memoized object and `ref` is a stable
  // `useCallback`; spreading them into a bare literal would hand callers a new
  // identity every render and re-run a consumer's `useImperativeHandle` / effect
  // deps. React Compiler can't compile this hook (the destructuring default
  // above hits a `BuildHIR::lowerAssignment` bail in babel-plugin-react-compiler
  // 1.0.0); keep this `useMemo` even if a future compiler starts emitting a
  // cache here — the stability test depends on it.
  return useMemo(() => ({ ref, ...chart }), [ref, chart]);
}
