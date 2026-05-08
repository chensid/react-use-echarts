/**
 * Browser smoke test: ResizeObserver-driven auto-resize.
 * jsdom doesn't run a real layout, so its ResizeObserver mock can't observe
 * actual size changes. Real chromium does — this verifies the RAF-throttled
 * resize loop is wired up end-to-end.
 *
 * Smoke-level: width changes are observable on the ECharts instance after a
 * container resize. Does NOT assert exact frame coalescing counts.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import useEcharts from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

function ResizableChart({
  chartRef,
  width,
}: {
  chartRef: { current: UseEchartsReturn | null };
  width: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chart = useEcharts(containerRef, {
    option: {
      xAxis: { type: "category", data: ["a", "b", "c"] },
      yAxis: { type: "value" },
      series: [{ type: "line", data: [1, 2, 3] }],
    },
  });
  chartRef.current = chart;

  return (
    <div ref={containerRef} style={{ width: `${width}px`, height: "300px" }} data-testid="chart" />
  );
}

describe("resize observer in real browser", () => {
  it("auto-resizes the chart when the container width changes", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { rerender, unmount } = render(<ResizableChart chartRef={chartRef} width={400} />);

    // Wait for initial layout + ECharts instance to register the starting width.
    let initialWidth = 0;
    const initialDeadline = Date.now() + 2000;
    while (Date.now() < initialDeadline) {
      const w = chartRef.current?.getWidth();
      if (typeof w === "number" && w > 0) {
        initialWidth = w;
        break;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(initialWidth).toBeGreaterThan(0);

    // Resize the container; ResizeObserver fires, RAF-throttled callback
    // calls instance.resize().
    rerender(<ResizableChart chartRef={chartRef} width={800} />);

    // Poll until the chart instance's reported width reflects the change.
    const deadline = Date.now() + 2000;
    let finalWidth = initialWidth;
    while (Date.now() < deadline) {
      const w = chartRef.current?.getWidth() ?? 0;
      if (w !== initialWidth) {
        finalWidth = w;
        break;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(finalWidth).not.toBe(initialWidth);
    expect(finalWidth).toBeGreaterThan(initialWidth);

    unmount();
  });
});
