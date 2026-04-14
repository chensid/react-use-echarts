import React, { useRef, useState } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const EventChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState<string>("(click on chart)");

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

  useEcharts(chartRef, {
    option,
    onEvents: {
      click: (params: unknown) => {
        const p = params as { value: number[] };
        setLastEvent(`click: [${p.value[0]}, ${p.value[1]}]`);
      },
      mouseover: {
        handler: (params: unknown) => {
          const p = params as { value: number[] };
          setLastEvent(`mouseover: [${p.value[0]}, ${p.value[1]}]`);
        },
        query: "series",
      },
    },
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
