/**
 * Browser smoke test: theme resolution against real ECharts.
 * The unit project mocks `echarts.init`, so only a real instance shows that a
 * custom theme object passed through unregistered is applied, and that the
 * "light" / "dark" built-ins resolve without `registerBuiltinThemes()`.
 *
 * Smoke-level: compares the resolved `backgroundColor` in `getOption()`.
 */
import { describe, it, expect } from "vite-plus/test";
import { render, waitFor } from "@testing-library/react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../hooks/use-echarts";
import type { UseEchartsOptions, UseEchartsReturn } from "../../types";

echarts.use([LineChart, GridComponent, CanvasRenderer]);

const option: UseEchartsOptions["option"] = {
  xAxis: { type: "category", data: ["a", "b", "c"] },
  yAxis: { type: "value" },
  series: [{ type: "line", data: [1, 2, 3] }],
};

function ThemedChart({
  chartRef,
  theme,
}: {
  chartRef: { current: UseEchartsReturn | null };
  theme: UseEchartsOptions["theme"];
}) {
  const chart = useEcharts({ option, theme });
  chartRef.current = chart;
  return <div ref={chart.ref} style={{ width: "300px", height: "200px" }} />;
}

async function backgroundFor(theme: UseEchartsOptions["theme"]): Promise<unknown> {
  const chartRef: { current: UseEchartsReturn | null } = { current: null };
  const { unmount } = render(<ThemedChart chartRef={chartRef} theme={theme} />);
  await waitFor(() => expect(chartRef.current?.instance).toBeDefined());
  const background = chartRef.current!.getOption()?.backgroundColor;
  unmount();
  return background;
}

describe("theme resolution in real browser", () => {
  it("applies an unregistered custom theme object", async () => {
    expect(await backgroundFor({ backgroundColor: "#123456" })).toBe("#123456");
  });

  it("resolves light to the default theme and dark to ECharts' own dark theme", async () => {
    const defaultBackground = await backgroundFor(undefined);
    expect(await backgroundFor("light")).toEqual(defaultBackground);
    expect(await backgroundFor("dark")).not.toEqual(defaultBackground);
  });
});
