/**
 * Browser smoke test: image export against real ECharts.
 * The unit project mocks the instance, so only a real one shows that the
 * documented no-argument calls work. ECharts 6.1.0's getConnectedDataURL
 * reads `opts.type` without a default, so the hook must supply one.
 *
 * Smoke-level: both calls return a PNG data URL.
 */
import { describe, it, expect } from "vite-plus/test";
import { render, waitFor } from "@testing-library/react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

echarts.use([LineChart, GridComponent, CanvasRenderer]);

function Chart({ chartRef }: { chartRef: { current: UseEchartsReturn | null } }) {
  const chart = useEcharts({
    option: {
      animation: false,
      xAxis: { type: "category", data: ["a", "b", "c"] },
      yAxis: { type: "value" },
      series: [{ type: "line", data: [1, 2, 3] }],
    },
  });
  chartRef.current = chart;
  return <div ref={chart.ref} style={{ width: "300px", height: "200px" }} />;
}

describe("image export in real browser", () => {
  it("exports with getDataURL() and getConnectedDataURL() called without options", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { unmount } = render(<Chart chartRef={chartRef} />);
    await waitFor(() => expect(chartRef.current?.instance).toBeDefined());

    expect(chartRef.current!.getDataURL()).toMatch(/^data:image\/png;base64,/);
    expect(chartRef.current!.getConnectedDataURL()).toMatch(/^data:image\/png;base64,/);

    unmount();
  });
});
