import { describe, expect, it } from "vite-plus/test";
import type { EChartsEventPayloadMap, UseEchartsReturn } from "../../types";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;

type AxisBreakActionName = "collapseAxisBreak" | "expandAxisBreak" | "toggleAxisBreak";
type AxisBreakEventIsPresent = Assert<
  "axisbreakchanged" extends keyof EChartsEventPayloadMap ? true : false
>;
type AxisBreakActionsAreNotEvents = Assert<
  IsNever<Extract<keyof EChartsEventPayloadMap, AxisBreakActionName>>
>;

const axisBreakEventIsPresent: AxisBreakEventIsPresent = true;
const axisBreakActionsAreNotEvents: AxisBreakActionsAreNotEvents = true;
const convertToPixelValue: Parameters<UseEchartsReturn["convertToPixel"]>[1] = [
  1,
  ["category", 2],
  null,
  undefined,
];

describe("public API types", () => {
  it("keeps axis-break actions separate from events", () => {
    expect(axisBreakEventIsPresent).toBe(true);
    expect(axisBreakActionsAreNotEvents).toBe(true);
  });

  it("accepts the coordinate tuples supported by ECharts convertToPixel", () => {
    expect(convertToPixelValue).toEqual([1, ["category", 2], null, undefined]);
  });
});
