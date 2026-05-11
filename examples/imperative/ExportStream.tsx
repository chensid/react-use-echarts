import React, { useEffect, useRef, useState } from "react";
import { EChart } from "../../src";
import type { UseEchartsReturn } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

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
const initialLast = initialData[initialData.length - 1];

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

const ExportStream: React.FC = () => {
  const chartRef = useRef<UseEchartsReturn>(null);
  const { mode } = useTheme();
  const [count, setCount] = useState(INITIAL_POINTS);
  const lastTsRef = useRef<number>(initialLast[0]);
  const lastValRef = useRef<number>(initialLast[1]);

  // Theme switch recreates the chart instance and reapplies baseOption;
  // resync local trackers so the count display matches reality.
  useEffect(() => {
    lastTsRef.current = initialLast[0];
    lastValRef.current = initialLast[1];
    setCount(INITIAL_POINTS);
  }, [mode]);

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

export default ExportStream;
