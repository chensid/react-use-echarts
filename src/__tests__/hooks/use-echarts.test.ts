import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import useEcharts from "../../hooks/use-echarts";
import { MutableRefObject } from "react";

// Mock ECharts library
vi.mock("echarts", () => {
  const mockInstance = {
    setOption: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    resize: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
  };
  return {
    init: vi.fn(() => mockInstance),
    ECharts: vi.fn(),
  };
});

describe("useEcharts", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  //  测试初始化
  it("should initialize the chart instance correctly", () => {
    const option: EChartsOption = { series: [{ type: "line" }] };
    const theme = "dark";
    
    // Create a mock div element
    const mockDiv = document.createElement("div");
    
    // Render the hook
    const { result, rerender } = renderHook(() =>
      useEcharts({
        option,
        theme,
      })
    );

    // Mock the chartRef to return our mock div
    const chartRef = result.current.chartRef as MutableRefObject<HTMLDivElement>;
    
    act(() => {
        chartRef.current = mockDiv;
    })
    // Re-render to trigger the useEffect that initializes the chart
    rerender();

    // Verify echarts.init was called with correct parameters
    expect(echarts.init).toHaveBeenCalledWith(mockDiv, theme);
    
    // Verify we can get the instance
    expect(result.current.getInstance()).toBeDefined();
  });

  // 测试 setOption
  it("should update chart options after initialization", () => {});

  // 测试加载状态
  it("should set loading correctly", () => {
    const { result } = renderHook(() =>
      useEcharts({ option: {} as EChartsOption })
    );
    result.current.setOption({ showLoading: true });
    expect(result.current.chartRef).toBeDefined();
  });

  // 测试事件处理
  // 测试实例获取
  // 测试响应式处理
});
