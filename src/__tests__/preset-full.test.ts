import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import * as echarts from "echarts/core";
import { registerEchartsFull } from "../preset-full";

vi.mock("echarts/core", () => ({
  use: vi.fn(),
}));

describe("registerEchartsFull", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call echarts.use once with every built-in installer", () => {
    registerEchartsFull();

    expect(echarts.use).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(echarts.use).mock.calls[0]?.[0];
    expect(Array.isArray(arg)).toBe(true);
    const installers = arg as unknown[];

    // echarts 6.1.0 ships 2 renderers + 21 charts + 31 components + 5 features
    // = 59 install functions. Assert ≥ 50 to stay resilient against minor
    // upstream additions while still catching accidental namespace omissions.
    expect(installers.length).toBeGreaterThanOrEqual(50);
    for (const installer of installers) {
      expect(typeof installer).toBe("function");
    }
  });
});
