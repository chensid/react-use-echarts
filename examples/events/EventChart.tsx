import React, { useRef, useState } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const EventChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState<string>("(click on chart)");

  const option: EChartsOption = {
    title: { text: "Click or Hover on Bars" },
    tooltip: {},
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [120, 200, 150, 80, 70] }],
  };

  useEcharts(chartRef, {
    option,
    onEvents: {
      click: (params: unknown) => {
        const p = params as { name: string; value: number };
        setLastEvent(`click: ${p.name} = ${p.value}`);
      },
      mouseover: {
        handler: (params: unknown) => {
          const p = params as { name: string };
          setLastEvent(`mouseover: ${p.name}`);
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
