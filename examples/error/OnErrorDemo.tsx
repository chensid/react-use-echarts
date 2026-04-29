import React, { useCallback, useRef, useState } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption, Payload } from "echarts";

const validOption: EChartsOption = {
  backgroundColor: "transparent",
  title: { text: "Daily Active Users" },
  tooltip: {},
  xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  yAxis: { type: "value" },
  series: [{ type: "line", data: [820, 932, 901, 934, 1290] }],
};

// ECharts 6 silently console.errors most malformed input — it rarely throws.
// To produce a real, hook-routable error we hand dispatchAction() a Proxy
// whose `get` trap throws on first read. ECharts reads `payload.type` early
// in dispatchAction (echarts/lib/core/echarts.js:991), the trap fires
// synchronously, the throw escapes through the hook's try/catch, and the
// hook routes it to onError. Crucially, we use the dispatchAction path —
// not setOption — because setOption sets an internal `inMainProcess` flag
// before the throw site, and that flag stays stuck if the throw escapes,
// permanently jamming subsequent setOption calls. dispatchAction has no
// such side effect, so Reset still works.
const cursedPayload = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    throw new Error(`demo: payload.${String(prop)} accessor threw on purpose`);
  },
}) as unknown as Payload;

const OnErrorDemo: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();
  const [lastError, setLastError] = useState<string | null>(null);

  const onError = useCallback((error: unknown) => {
    setLastError(error instanceof Error ? error.message : String(error));
  }, []);

  const { dispatchAction } = useEcharts(chartRef, {
    option: validOption,
    theme: mode,
    onError,
  });

  const triggerError = (): void => {
    setLastError(null);
    // Imperative dispatchAction is wrapped in the hook's try/catch; the
    // proxy's get trap fires when ECharts reads `payload.type`, the throw
    // escapes setOption's call frame, and the hook hands the error to
    // onError instead of re-throwing.
    dispatchAction(cursedPayload);
  };

  const reset = (): void => {
    setLastError(null);
  };

  return (
    <div>
      <div className="controls">
        <button type="button" className="btn" onClick={triggerError}>
          Trigger Error
        </button>
        <button type="button" className="btn" onClick={reset} disabled={lastError === null}>
          Reset
        </button>
      </div>
      <div ref={chartRef} className="chart-container" />
      {lastError ? (
        <pre
          role="alert"
          style={{
            marginTop: 12,
            padding: 12,
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.4)",
            color: "rgb(220, 38, 38)",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 13,
          }}
        >
          onError fired: {lastError}
        </pre>
      ) : null}
    </div>
  );
};

export default OnErrorDemo;
