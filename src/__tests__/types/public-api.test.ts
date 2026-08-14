import { describe, expect, it } from "vite-plus/test";
import * as publicApi from "../../index";
import type {
  BuiltinTheme,
  ChartFinder,
  ChartScaleValue,
  EChartHandle,
  EChartProps,
  EChartsEventConfig,
  EChartsEventHandler,
  EChartsEventPayloadMap,
  EChartsEvents,
  EChartsInitOpts,
  EChartsOption,
  LoadingOption,
  Payload,
  ResizeOpts,
  SetOptionOpts,
  UseEchartsOptions,
  UseEchartsReturn,
  UseLazyInitReturn,
} from "../../index";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;

type AxisBreakActionName = "collapseAxisBreak" | "expandAxisBreak" | "toggleAxisBreak";
type AxisBreakEventIsPresent = Assert<
  "axisbreakchanged" extends keyof EChartsEventPayloadMap ? true : false
>;
type AxisBreakActionsAreNotEvents = Assert<
  IsNever<Extract<keyof EChartsEventPayloadMap, AxisBreakActionName>>
>;
type PublicTypeExports = {
  BuiltinTheme: BuiltinTheme;
  ChartFinder: ChartFinder;
  ChartScaleValue: ChartScaleValue;
  EChartHandle: EChartHandle;
  EChartProps: EChartProps;
  EChartsEventConfig: EChartsEventConfig;
  EChartsEventHandler: EChartsEventHandler;
  EChartsEventPayloadMap: EChartsEventPayloadMap;
  EChartsEvents: EChartsEvents;
  EChartsInitOpts: EChartsInitOpts;
  EChartsOption: EChartsOption;
  LoadingOption: LoadingOption;
  Payload: Payload;
  ResizeOpts: ResizeOpts;
  SetOptionOpts: SetOptionOpts;
  UseEchartsOptions: UseEchartsOptions;
  UseEchartsReturn: UseEchartsReturn;
  UseLazyInitReturn: UseLazyInitReturn;
};
type PublicTypeExportsAreReachable = Assert<keyof PublicTypeExports extends string ? true : false>;

const axisBreakEventIsPresent: AxisBreakEventIsPresent = true;
const axisBreakActionsAreNotEvents: AxisBreakActionsAreNotEvents = true;
const publicTypeExportsAreReachable: PublicTypeExportsAreReachable = true;
const convertToPixelValue: Parameters<UseEchartsReturn["convertToPixel"]>[1] = [
  1,
  ["category", 2],
  null,
  undefined,
];

describe("public API types", () => {
  it("exposes the intended runtime API from the package root", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "EChart",
      "isBuiltinTheme",
      "isKnownTheme",
      "mergeRefs",
      "registerCustomTheme",
      "useEcharts",
      "useLazyInit",
    ]);
    expect(publicTypeExportsAreReachable).toBe(true);
  });

  it("keeps axis-break actions separate from events", () => {
    expect(axisBreakEventIsPresent).toBe(true);
    expect(axisBreakActionsAreNotEvents).toBe(true);
  });

  it("accepts the coordinate tuples supported by ECharts convertToPixel", () => {
    expect(convertToPixelValue).toEqual([1, ["category", 2], null, undefined]);
  });
});
