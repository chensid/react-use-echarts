import React, { useMemo, useState } from "react";
import { useEcharts, type EChartsEvents, type EChartsOption } from "../../src";
import { useTheme } from "../components/theme-context";
import type { ECElementEvent } from "echarts";

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

const describePointEvent = (name: string, params: ECElementEvent): string => {
  // `params` is inferred as ECElementEvent thanks to the typed
  // EChartsEvents map; only narrow `value` to a number tuple here.
  const [x = 0, y = 0] = params.value as number[];
  return `${name}: [${x}, ${y}]`;
};

const EventChart: React.FC = () => {
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

  const { ref } = useEcharts({
    option,
    theme: mode,
    onEvents,
  });

  return (
    <div>
      <div className="note-box" style={{ marginBottom: 10 }}>
        Last event: {lastEvent}
      </div>
      <div ref={ref} className="chart-container" />
    </div>
  );
};

export default EventChart;
