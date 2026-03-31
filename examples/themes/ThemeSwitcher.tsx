import React, { useRef, useState, useMemo } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const THEMES = ["light", "dark", "macarons", "custom"] as const;

const ThemeSwitcher: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [themeIndex, setThemeIndex] = useState(0);

  const customTheme = useMemo(
    () => ({
      color: ["#fc8452", "#9a60b4", "#ea7ccc", "#73c0de"],
      backgroundColor: "#fafafa",
    }),
    [],
  );

  const currentTheme = THEMES[themeIndex];
  const theme = currentTheme === "custom" ? customTheme : currentTheme;

  const option: EChartsOption = {
    title: { text: `Theme: ${currentTheme}` },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: { type: "value" },
    series: [
      { name: "Sales", type: "bar", data: [120, 200, 150, 80, 70, 110, 130] },
      { name: "Revenue", type: "line", data: [90, 160, 120, 60, 50, 80, 100] },
    ],
  };

  useEcharts(chartRef, { option, theme });

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        {THEMES.map((t, i) => (
          <button
            key={t}
            onClick={() => setThemeIndex(i)}
            style={{
              marginRight: "8px",
              fontWeight: i === themeIndex ? "bold" : "normal",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
};

export default ThemeSwitcher;
