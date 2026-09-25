/**
 * Browser smoke test: coordinate conversion against real ECharts.
 * The unit project mocks the instance, so only a real calendar coordinate
 * system shows that the documented `calendarIndex` finder and the ECharts 6
 * `convertToLayout` API work through the hook.
 *
 * Smoke-level: results are finite and the layout rect has a positive size.
 */
import { describe, it, expect } from "vite-plus/test";
import { render, waitFor } from "@testing-library/react";
import * as echarts from "echarts/core";
import { CalendarComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

echarts.use([CalendarComponent, CanvasRenderer]);

function CalendarChart({ chartRef }: { chartRef: { current: UseEchartsReturn | null } }) {
  const chart = useEcharts({ option: { calendar: { range: "2021-01" } } });
  chartRef.current = chart;
  return <div ref={chart.ref} style={{ width: "600px", height: "300px" }} />;
}

describe("coordinate conversion in real browser", () => {
  it("converts calendar dates with convertToPixel and convertToLayout", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { unmount } = render(<CalendarChart chartRef={chartRef} />);
    await waitFor(() => expect(chartRef.current?.instance).toBeDefined());
    const chart = chartRef.current!;

    const point = chart.convertToPixel({ calendarIndex: 0 }, "2021-01-05");
    expect(Array.isArray(point) && point.every(Number.isFinite)).toBe(true);

    const layout = chart.convertToLayout({ calendarIndex: 0 }, "2021-01-05");
    expect(layout?.rect?.width).toBeGreaterThan(0);
    expect(layout?.rect?.height).toBeGreaterThan(0);

    unmount();
  });
});
