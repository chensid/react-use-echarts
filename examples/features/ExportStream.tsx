import React, { useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { EChart, type EChartHandle, type EChartsOption } from "react-use-echarts";
import { useTheme, type ThemeMode } from "../components/theme-context";

echarts.use([LineChart, GridComponent, TitleComponent, TooltipComponent]);

const MAX_POINTS = 200;
const APPEND_BATCH = 20;
const INITIAL_POINTS = 30;
const STEP_MS = 1000;

type Point = [number, number];

function nextValue(prev: number): number {
  const next = prev + (Math.random() - 0.5) * 12;
  return Math.max(0, Math.min(100, next));
}

function generateInitial(): Point[] {
  const now = Date.now();
  const pts: Point[] = [];
  let v = 50;
  for (let i = INITIAL_POINTS - 1; i >= 0; i--) {
    v = nextValue(v);
    pts.push([now - i * STEP_MS, v]);
  }
  return pts;
}

const initialData = generateInitial();
const initialLast = initialData[initialData.length - 1]!;

const baseOption: EChartsOption = {
  backgroundColor: "transparent",
  title: { text: "Streaming Series" },
  tooltip: { trigger: "axis" },
  xAxis: { type: "time" },
  yAxis: { type: "value", min: 0, max: 100 },
  grid: { top: 50, bottom: 30, left: 45, right: 20 },
  series: [
    {
      type: "line",
      data: initialData,
      smooth: true,
      showSymbol: false,
      areaStyle: { opacity: 0.2 },
    },
  ],
  animation: false,
};

const ExportStreamChart: React.FC<{ readonly mode: ThemeMode }> = ({ mode }) => {
  const chartRef = useRef<EChartHandle>(null);
  const [count, setCount] = useState(INITIAL_POINTS);
  const lastTsRef = useRef<number>(initialLast[0]);
  const lastValRef = useRef<number>(initialLast[1]);

  const handleAppend = () => {
    const batch: Point[] = [];
    for (let i = 0; i < APPEND_BATCH; i++) {
      lastTsRef.current += STEP_MS;
      lastValRef.current = nextValue(lastValRef.current);
      batch.push([lastTsRef.current, lastValRef.current]);
    }
    chartRef.current?.appendData({ seriesIndex: 0, data: batch });
    setCount((c) => c + APPEND_BATCH);
  };

  const handleDownload = () => {
    // Match exported PNG bg to current mode — white bg would hide dark-mode light text.
    const backgroundColor = mode === "dark" ? "#0f0f11" : "#ffffff";
    const url = chartRef.current?.getDataURL({ pixelRatio: 2, backgroundColor });
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.png";
    a.click();
  };

  const handleReset = () => {
    chartRef.current?.setOption(baseOption, { notMerge: true });
    lastTsRef.current = initialLast[0];
    lastValRef.current = initialLast[1];
    setCount(INITIAL_POINTS);
  };

  const reachedCap = count >= MAX_POINTS;

  return (
    <div>
      <div className="controls">
        <button type="button" className="btn" onClick={handleAppend} disabled={reachedCap}>
          Append {APPEND_BATCH} points
        </button>
        <button type="button" className="btn" onClick={handleDownload}>
          Download PNG
        </button>
        <button type="button" className="btn" onClick={handleReset}>
          Reset
        </button>
        <span className="note-box">
          {count} / {MAX_POINTS} points
        </span>
      </div>
      <EChart
        ref={chartRef}
        option={baseOption}
        theme={mode}
        style={{ height: "340px", width: "100%", marginTop: 10 }}
      />
    </div>
  );
};

// A theme change recreates the ECharts instance, which re-applies baseOption and
// drops the appended points. Keying the chart by theme remounts it with the
// instance, so its point counter and trackers reset too — React's way to reset
// all state when a prop changes (react.dev, "Resetting all state when a prop
// changes"), instead of resyncing them in an effect.
const ExportStream: React.FC = () => {
  const { mode } = useTheme();
  return <ExportStreamChart key={mode} mode={mode} />;
};

export default ExportStream;
