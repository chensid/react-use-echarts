import React, { useCallback, useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

echarts.use([LineChart, GridComponent, TitleComponent, TooltipComponent]);

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

function randomValue(base: number) {
  return +(base + (Math.random() - 0.5) * 20).toFixed(1);
}

const INITIAL_COUNT = 20;

interface SeriesData {
  readonly times: string[];
  readonly values: number[];
}

function generateInitialData(): SeriesData {
  const now = Date.now();
  const times: string[] = [];
  const values: number[] = [];
  for (let i = INITIAL_COUNT - 1; i >= 0; i--) {
    times.push(formatTime(new Date(now - i * 1000)));
    values.push(randomValue(50));
  }
  return { times, values };
}

function buildOption({ times, values }: SeriesData): EChartsOption {
  return {
    backgroundColor: "transparent",
    title: { text: "Real-time Monitor" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: times, boundaryGap: false },
    yAxis: { type: "value", min: 20, max: 80 },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        areaStyle: { opacity: 0.2 },
        showSymbol: false,
      },
    ],
    grid: { top: 50, bottom: 30, left: 45, right: 20 },
    animation: false,
  };
}

const DynamicChart: React.FC = () => {
  const { mode } = useTheme();
  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(INITIAL_COUNT);
  // Create the data and option once. The option keeps one reference for the
  // component's lifetime, so re-renders (the point counter, Start/Stop) never
  // re-apply it over the live chart; the interval below streams through
  // setOption instead. A theme switch re-creates the chart from this option,
  // whose arrays the interval has kept up to date.
  const [initial] = useState(() => {
    const data = generateInitialData();
    return { data, option: buildOption(data) };
  });
  const dataRef = useRef(initial.data);

  const { ref, setOption } = useEcharts({ option: initial.option, theme: mode });

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      const { times, values } = dataRef.current;
      times.push(formatTime(new Date()));
      values.push(randomValue(values[values.length - 1]!));

      if (times.length > 60) {
        times.shift();
        values.shift();
      }

      setCount(times.length);
      setOption({
        xAxis: { data: times },
        series: [{ data: values }],
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, setOption]);

  const handleToggle = useCallback(() => setRunning((prev) => !prev), []);

  return (
    <div>
      <div className="controls">
        <button type="button" className="btn" onClick={handleToggle}>
          {running ? "Stop" : "Start"}
        </button>
        <span className="note-box">{count} data points</span>
      </div>
      <div ref={ref} className="chart-container" style={{ marginTop: 10 }} />
    </div>
  );
};

export default DynamicChart;
