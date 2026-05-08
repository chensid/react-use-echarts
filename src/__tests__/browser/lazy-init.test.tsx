/**
 * Browser smoke test: lazy initialization triggered by IntersectionObserver.
 * jsdom can't simulate viewport/scroll geometry, so this exercises the real
 * IntersectionObserver against a chromium frame.
 *
 * Smoke-level: assert that scrolling the chart into view causes
 * `getInstance()` to transition from undefined → defined. Not asserting exact
 * timing or layout numbers.
 */
import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { useRef } from "react";
import useEcharts from "../../hooks/use-echarts";
import type { UseEchartsReturn } from "../../types";

function LazyChart({ chartRef }: { chartRef: { current: UseEchartsReturn | null } }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chart = useEcharts(containerRef, {
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
      <div ref={containerRef} style={{ width: "400px", height: "300px" }} data-testid="chart" />
    </div>
  );
}

describe("lazy init in real browser", () => {
  it("creates the ECharts instance only after the container scrolls into view", async () => {
    const chartRef: { current: UseEchartsReturn | null } = { current: null };
    const { getByTestId, unmount } = render(<LazyChart chartRef={chartRef} />);

    // Before scroll: container is well below the viewport — no instance yet.
    expect(chartRef.current?.getInstance()).toBeUndefined();

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
        if (chartRef.current?.getInstance()) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    });

    expect(chartRef.current?.getInstance()).toBeDefined();
    // Sanity: the resolved instance is wired to the actual DOM container.
    expect(chartRef.current?.getInstance()?.getDom()).toBe(chartEl);

    unmount();
    void host;
  });
});
