/**
 * Browser integration test: visibility-resume resize.
 *
 * Headless Chromium does not expose a reliable native tab-background switch,
 * so the read-only visibility state is shadowed on this document while the
 * actual event delivery, React hook, coordinator, cache and ECharts instance
 * all run in Chromium. This verifies the complete application-level resync
 * path without relying on a synthetic DOM implementation.
 */
import { render } from "@testing-library/react";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { describe, expect, it, vi } from "vite-plus/test";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

echarts.use([LineChart, GridComponent, CanvasRenderer]);

function VisibilityChart({ chartRef }: { chartRef: { current: UseEchartsReturn | null } }) {
  const chart = useEcharts({
    autoResize: true,
    option: {
      xAxis: { type: "category", data: ["a", "b", "c"] },
      yAxis: { type: "value" },
      series: [{ type: "line", data: [1, 2, 3] }],
    },
  });
  chartRef.current = chart;

  return <div ref={chart.ref} style={{ width: "400px", height: "300px" }} />;
}

describe("visibilitychange resync in real browser", () => {
  it("resizes the chart when the document returns to the foreground", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { unmount } = render(<VisibilityChart chartRef={chartRef} />);
    const ownHiddenDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
    let hidden = true;

    try {
      const deadline = Date.now() + 2000;
      while (!chartRef.current?.instance && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const instance = chartRef.current?.instance;
      expect(instance).toBeDefined();
      if (!instance) throw new Error("ECharts instance did not initialize");

      // Let the initial ResizeObserver/RAF cycle settle before counting calls
      // caused specifically by visibilitychange.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => hidden,
      });

      const resizeSpy = vi.spyOn(instance, "resize");
      try {
        const beforeHidden = resizeSpy.mock.calls.length;
        document.dispatchEvent(new Event("visibilitychange"));
        expect(resizeSpy).toHaveBeenCalledTimes(beforeHidden);

        hidden = false;
        const beforeVisible = resizeSpy.mock.calls.length;
        document.dispatchEvent(new Event("visibilitychange"));
        expect(resizeSpy).toHaveBeenCalledTimes(beforeVisible + 1);
      } finally {
        resizeSpy.mockRestore();
      }
    } finally {
      try {
        unmount();
      } finally {
        if (ownHiddenDescriptor) {
          Object.defineProperty(document, "hidden", ownHiddenDescriptor);
        } else {
          delete (document as unknown as { hidden?: boolean }).hidden;
        }
      }
    }
  });
});
