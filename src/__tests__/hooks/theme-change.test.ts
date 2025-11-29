import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as echarts from "echarts";
import useEcharts from "../../hooks/use-echarts";
import { getCachedInstance, clearInstanceCache } from "../../utils/instance-cache";
import type { BuiltinTheme } from "../../types";

// Mock ECharts
vi.mock("echarts", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(() => {
    // Immediately trigger as intersecting for tests
    callback([{ isIntersecting: true }]);
  }),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

describe("Theme change behavior", () => {
  beforeEach(() => {
    clearInstanceCache();
    vi.clearAllMocks();
  });

  it("should create new instance when theme changes", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    // Mock instances
    const mockInstance1 = {
      setOption: vi.fn(),
      dispose: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getDom: vi.fn(() => element),
      resize: vi.fn(),
    };

    const mockInstance2 = {
      setOption: vi.fn(),
      dispose: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getDom: vi.fn(() => element),
      resize: vi.fn(),
    };

    // First call returns instance1
    (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockInstance1);
    // Second call (theme change) returns instance2
    (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockInstance2);

    const baseOption = { series: [{ type: "line" as const, data: [1, 2, 3] }] };

    // First render with light theme
    const { rerender } = renderHook<
      ReturnType<typeof useEcharts>,
      { ref: typeof ref; theme: BuiltinTheme }
    >(
      ({ ref, theme }) => useEcharts(ref, { option: baseOption, theme }),
      { initialProps: { ref, theme: "light" } }
    );

    // Should have created first instance
    expect(echarts.init).toHaveBeenCalledTimes(1);
    expect(mockInstance1.setOption).toHaveBeenCalled();

    // Rerender with dark theme
    rerender({ ref, theme: "dark" });

    // Should have disposed old instance and created new one
    expect(mockInstance1.dispose).toHaveBeenCalledTimes(1);
    expect(echarts.init).toHaveBeenCalledTimes(2);
    expect(mockInstance2.setOption).toHaveBeenCalled();

    // Cache should contain the new instance
    expect(getCachedInstance(element)).toBe(mockInstance2);
  });
});
