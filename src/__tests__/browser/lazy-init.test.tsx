/**
 * Browser smoke test: lazy initialization triggered by IntersectionObserver.
 * happy-dom can't simulate viewport/scroll geometry, so this exercises the real
 * IntersectionObserver against a chromium frame.
 *
 * Smoke-level: assert that scrolling the chart into view causes
 * `chart.instance` to transition from undefined → defined. Not asserting exact
 * timing or layout numbers.
 */
import { describe, it, expect } from "vite-plus/test";
import { render, act } from "@testing-library/react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

// The library is fully modular and does not auto-register anything —
// register just what this test renders.
echarts.use([LineChart, GridComponent, CanvasRenderer]);

function LazyChart({ chartRef }: { chartRef: { current: UseEchartsReturn | null } }) {
  const chart = useEcharts({
    option: {
      xAxis: { type: "category", data: ["a", "b", "c"] },
      yAxis: { type: "value" },
      series: [{ type: "line", data: [1, 2, 3] }],
    },
    lazyInit: true,
  });
  chartRef.current = chart;

  return (
    <div style={{ height: "100vh", overflow: "auto" }} data-testid="scroll-host">
      {/* Spacer to push the chart below the initial viewport */}
      <div style={{ height: "200vh" }} />
      <div ref={chart.ref} style={{ width: "400px", height: "300px" }} data-testid="chart" />
    </div>
  );
}

describe("lazy init in real browser", () => {
  it("creates the ECharts instance only after the container scrolls into view", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { getByTestId, unmount } = render(<LazyChart chartRef={chartRef} />);

    // Before scroll: container is well below the viewport — no instance yet.
    expect(chartRef.current?.instance).toBeUndefined();

    const host = getByTestId("scroll-host");
    const chartEl = getByTestId("chart");

    // Scroll the chart into view. IntersectionObserver fires asynchronously,
    // so wait for the observer + state update + lifecycle effect to settle.
    // act() suppresses the React state-update warning when the observer's
    // setState lands.
    await act(async () => {
      chartEl.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center" });

      // Poll for up to 2s — IntersectionObserver microtask + React commit.
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        if (chartRef.current?.instance) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    });

    expect(chartRef.current?.instance).toBeDefined();
    // Sanity: the resolved instance is wired to the actual DOM container.
    expect(chartRef.current?.instance?.getDom()).toBe(chartEl);

    unmount();
    void host;
  });
});
