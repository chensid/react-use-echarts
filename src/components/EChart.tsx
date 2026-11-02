import { useImperativeHandle, type Ref } from "react";
import { useEcharts } from "../hooks/use-echarts";
import type { EChartHandle, EChartProps } from "../types";

/**
 * Declarative EChart component — thin wrapper around useEcharts
 * 声明式 EChart 组件 — useEcharts 的薄封装
 *
 * Default container style: `{ width: '100%', height: '100%' }`, overridable via
 * `style`; the parent needs an explicit height.
 *
 * @example
 * ```tsx
 * <EChart option={{ series: [{ type: 'line', data: [1,2,3] }] }} />
 * ```
 */
export function EChart({
  ref,
  option,
  theme,
  renderer,
  lazyInit,
  group,
  setOptionOpts,
  showLoading,
  loadingOption,
  onEvents,
  autoResize,
  initOpts,
  onError,
  style,
  // Runtime JS callers can bypass the TypeScript exclusions; discard both
  // content-owning props so React never competes with ECharts for this div.
  children: _children,
  dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
  ...containerProps
}: EChartProps & { ref?: Ref<EChartHandle> }) {
  const chart = useEcharts({
    option,
    theme,
    renderer,
    lazyInit,
    group,
    setOptionOpts,
    showLoading,
    loadingOption,
    onEvents,
    autoResize,
    initOpts,
    onError,
  });
  // Strip `ref` so external callers can't reassign the container via
  // `handle.ref(otherNode)` (see EChartHandle).
  useImperativeHandle(ref, () => {
    const { ref: _containerRef, ...api } = chart;
    return api;
  }, [chart]);
  const { ref: containerRef } = chart;
  return (
    <div
      {...containerProps}
      ref={containerRef}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
