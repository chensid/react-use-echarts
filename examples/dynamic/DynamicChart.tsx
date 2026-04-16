import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

function randomValue(base: number) {
  return +(base + (Math.random() - 0.5) * 20).toFixed(1);
}

const INITIAL_COUNT = 20;

function generateInitialData() {
  const now = Date.now();
  const times: string[] = [];
  const values: number[] = [];
  for (let i = INITIAL_COUNT - 1; i >= 0; i--) {
    times.push(formatTime(new Date(now - i * 1000)));
    values.push(randomValue(50));
  }
  return { times, values };
}

const DynamicChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(INITIAL_COUNT);
  const dataRef = useRef(generateInitialData());

  const optionRef = useRef<EChartsOption>({
    backgroundColor: "transparent",
    title: { text: "Real-time Monitor" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: dataRef.current.times, boundaryGap: false },
    yAxis: { type: "value", min: 20, max: 80 },
    series: [
      {
        type: "line",
        data: dataRef.current.values,
        smooth: true,
        areaStyle: { opacity: 0.2 },
        showSymbol: false,
      },
    ],
    grid: { top: 50, bottom: 30, left: 45, right: 20 },
    animation: false,
  });

  const { setOption } = useEcharts(chartRef, { option: optionRef.current });

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      const { times, values } = dataRef.current;
      times.push(formatTime(new Date()));
      values.push(randomValue(values[values.length - 1]));

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
      <div ref={chartRef} className="chart-container" style={{ marginTop: 10 }} />
    </div>
  );
};

export default DynamicChart;
