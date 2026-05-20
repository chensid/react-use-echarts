import React, { useMemo, useRef, useState } from "react";
import { useEcharts, type EChartsEvents } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const option: EChartsOption = {
  backgroundColor: "transparent",
  title: { text: "Click or Hover on Points" },
  tooltip: { trigger: "item" },
  xAxis: { type: "value", name: "Height (cm)" },
  yAxis: { type: "value", name: "Weight (kg)" },
  series: [
    {
      type: "scatter",
      symbolSize: 14,
      data: [
        [168, 65],
        [170, 70],
        [172, 68],
        [175, 80],
        [178, 75],
        [180, 82],
        [182, 78],
        [165, 58],
        [173, 72],
        [177, 76],
      ],
    },
  ],
};

const describePointEvent = (name: string, params: unknown): string => {
  const point = (params as { value: number[] }).value;
  return `${name}: [${point[0]}, ${point[1]}]`;
};

const EventChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();
  const [lastEvent, setLastEvent] = useState<string>("(click on chart)");

  const onEvents = useMemo<EChartsEvents>(
    () => ({
      click: (params) => setLastEvent(describePointEvent("click", params)),
      mouseover: {
        handler: (params) => setLastEvent(describePointEvent("mouseover", params)),
        query: "series",
      },
    }),
    [],
  );

  useEcharts(chartRef, {
    option,
    theme: mode,
    onEvents,
  });

  return (
    <div>
      <div className="note-box" style={{ marginBottom: 10 }}>
        Last event: {lastEvent}
      </div>
      <div ref={chartRef} className="chart-container" />
    </div>
  );
};

export default EventChart;
