/**
 * Browser smoke test: event proxies against real ECharts.
 * The unit project mocks `on`/`off`, so only a real instance shows that an
 * event fired by ECharts reaches the handler from the latest render — with an
 * inline `onEvents` object and no rebinding in between.
 *
 * Smoke-level: dispatches a `highlight` action and checks which handler ran.
 */
import { describe, it, expect, vi } from "vite-plus/test";
import { render, waitFor } from "@testing-library/react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsOptions, UseEchartsReturn } from "../../types";

echarts.use([LineChart, GridComponent, LegendComponent, CanvasRenderer]);

const option: UseEchartsOptions["option"] = {
  xAxis: { type: "category", data: ["a", "b", "c"] },
  yAxis: { type: "value" },
  series: [{ type: "line", data: [1, 2, 3] }],
};

function Chart({
  chartRef,
  onHighlight,
}: {
  chartRef: { current: UseEchartsReturn | null };
  onHighlight: (params: unknown) => void;
}) {
  // Inline object and handler: a new reference on every render.
  const chart = useEcharts({ option, onEvents: { highlight: (p) => onHighlight(p) } });
  chartRef.current = chart;
  return <div ref={chart.ref} style={{ width: "400px", height: "300px" }} />;
}

function LegendChart({
  chartRef,
  onLegend,
}: {
  chartRef: { current: UseEchartsReturn | null };
  onLegend: (params: unknown) => void;
}) {
  const chart = useEcharts({
    option: { ...option, legend: {}, series: [{ name: "A", type: "line", data: [1, 2, 3] }] },
    onEvents: { legendselectchanged: onLegend },
  });
  chartRef.current = chart;
  return <div ref={chart.ref} style={{ width: "400px", height: "300px" }} />;
}

describe("event proxies in real browser", () => {
  it("delivers ECharts events to the latest inline handler", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(<Chart chartRef={chartRef} onHighlight={first} />);
    await waitFor(() => expect(chartRef.current?.instance).toBeDefined());

    chartRef.current!.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: 1 });
    expect(first).toHaveBeenCalledTimes(1);

    rerender(<Chart chartRef={chartRef} onHighlight={second} />);
    chartRef.current!.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: 2 });

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("delivers legendselectchanged with the documented payload shape", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const onLegend = vi.fn();
    const { unmount } = render(<LegendChart chartRef={chartRef} onLegend={onLegend} />);
    await waitFor(() => expect(chartRef.current?.instance).toBeDefined());

    chartRef.current!.dispatchAction({ type: "legendToggleSelect", name: "A" });

    expect(onLegend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "legendselectchanged", name: "A", selected: { A: false } }),
    );
    unmount();
  });
});
