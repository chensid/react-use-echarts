import { useImperativeHandle, type Ref } from "react";
import { useEcharts } from "../hooks/use-echarts";
import type { EChartHandle, EChartProps } from "../types";

/**
 * Declarative EChart component — thin wrapper around useEcharts
 * 声明式 EChart 组件 — useEcharts 的薄封装
 *
 * Default container style: `{ width: '100%', height: '100%' }`.
 * The parent must have an explicit height; override either via the `style` prop.
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
  className,
  children: _children,
  dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
  ...containerProps
}: EChartProps & { ref?: Ref<EChartHandle> }) {
  // Runtime JS callers can bypass the TypeScript exclusions; discard both
  // content-owning props so React never competes with ECharts for this div.
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
  // Strip the container `ref` field from the imperative handle so external
  // callers can't reassign the chart's DOM element via `handle.ref(otherNode)`.
  // The handle only exposes the reactive `instance` + imperative methods.
  useImperativeHandle(ref, () => {
    const { ref: _containerRef, ...api } = chart;
    return api;
  }, [chart]);
  return (
    <div
      {...containerProps}
      ref={chart.ref}
      style={{ width: "100%", height: "100%", ...style }}
      className={className}
    />
  );
}
