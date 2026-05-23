import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { act, renderHook } from "@testing-library/react";
import * as echarts from "echarts/core";
import { useEcharts } from "../../hooks/use-echarts";
import { getCachedInstance, clearInstanceCache } from "../../utils/instance-cache";
import { clearGroups } from "../../utils/connect";
import type { BuiltinTheme } from "../../types";
import { __clearThemeCacheForTesting__ } from "../../themes";
import { createMockInstance, MockResizeObserver, MockIntersectionObserver } from "../helpers";

// Mock ECharts
vi.mock("echarts/core", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe("Theme change behavior", () => {
  beforeEach(() => {
    clearInstanceCache();
    clearGroups();
    __clearThemeCacheForTesting__();
    vi.clearAllMocks();
  });

  it("should create new instance when theme changes", () => {
    const element = document.createElement("div");

    const mockInstance1 = createMockInstance(element);
    const mockInstance2 = createMockInstance(element);

    // First call returns instance1
    (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockInstance1);
    // Second call (theme change) returns instance2
    (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockInstance2);

    const baseOption = { series: [{ type: "line" as const, data: [1, 2, 3] }] };

    // First render with light theme
    const { result, rerender } = renderHook<ReturnType<typeof useEcharts>, { theme: BuiltinTheme }>(
      ({ theme }) => useEcharts({ option: baseOption, theme }),
      {
        initialProps: { theme: "light" },
      },
    );

    // Attach the element to the hook's callback ref; the queued setState
    // schedules a re-render that triggers the lifecycle effect.
    act(() => {
      result.current.ref(element);
    });

    // Should have created first instance
    expect(echarts.init).toHaveBeenCalledTimes(1);
    expect(mockInstance1.setOption).toHaveBeenCalled();

    // Rerender with dark theme
    rerender({ theme: "dark" });

    // Should have disposed old instance and created new one
    expect(mockInstance1.dispose).toHaveBeenCalledTimes(1);
    expect(echarts.init).toHaveBeenCalledTimes(2);
    expect(mockInstance2.setOption).toHaveBeenCalled();

    // Cache should contain the new instance
    expect(getCachedInstance(element)).toBe(mockInstance2);
  });
});
