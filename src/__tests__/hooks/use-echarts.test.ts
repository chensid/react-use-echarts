import { act, renderHook, waitFor } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  type MockedFunction,
} from "vitest";
import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";
import useEcharts from "../../hooks/use-echarts";

// Create a mock instance interface
interface MockEChartsInstance {
  setOption: MockedFunction<ECharts["setOption"]>;
  dispose: MockedFunction<ECharts["dispose"]>;
  on: MockedFunction<ECharts["on"]>;
  off: MockedFunction<ECharts["off"]>;
  resize: MockedFunction<ECharts["resize"]>;
  showLoading: MockedFunction<ECharts["showLoading"]>;
  hideLoading: MockedFunction<ECharts["hideLoading"]>;
}

// Mock ECharts library
vi.mock("echarts", () => {
  const mockInstance: MockEChartsInstance = {
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

// Mock ResizeObserver with proper types
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as typeof ResizeObserver;

describe("useEcharts", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // 测试初始化
  it("should initialize the chart instance correctly", async () => {
    const option: EChartsOption = { series: [{ type: "line" }] };
    const theme = "dark";

    // Create a mock div element
    const mockDiv = document.createElement("div");
    document.body.appendChild(mockDiv);

    // Create a wrapper component that uses the hook
    const { result, rerender } = renderHook(() => {
      const hookResult = useEcharts({
        option,
        theme,
      });
      // Simulate setting the ref
      if (hookResult.chartRef.current !== mockDiv) {
        hookResult.chartRef.current = mockDiv;
      }
      return hookResult;
    });

    // Trigger re-render to ensure useEffect runs
    await act(async () => {
      rerender();
      // Wait for microtasks to complete
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    });

    // Wait for the chart to be initialized
    await waitFor(
      () => {
        expect(echarts.init).toHaveBeenCalledWith(mockDiv, theme);
      },
      { timeout: 2000 }
    );

    // Verify we can get the instance
    expect(result.current.getInstance()).toBeDefined();

    // Cleanup
    document.body.removeChild(mockDiv);
  });

  // 测试 setOption
  it("should update chart options after initialization", async () => {
    const initialOption: EChartsOption = { series: [{ type: "line" }] };
    const newOption: EChartsOption = { series: [{ type: "bar" }] };

    const mockDiv = document.createElement("div");
    document.body.appendChild(mockDiv);

    const { result, rerender } = renderHook(() => {
      const hookResult = useEcharts({ option: initialOption });
      if (hookResult.chartRef.current !== mockDiv) {
        hookResult.chartRef.current = mockDiv;
      }
      return hookResult;
    });

    await act(async () => {
      rerender();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    });

    // Wait for initialization
    await waitFor(
      () => {
        expect(echarts.init).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    const mockInit = echarts.init as MockedFunction<typeof echarts.init>;
    const mockInstance = mockInit.mock.results[0]?.value as MockEChartsInstance;

    // Test setOption
    await act(async () => {
      result.current.setOption(newOption);
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    });

    expect(mockInstance.setOption).toHaveBeenCalledWith(newOption, undefined);

    // Cleanup
    document.body.removeChild(mockDiv);
  });

  // 测试加载状态
  it("should handle loading state correctly", async () => {
    const option: EChartsOption = { series: [{ type: "line" }] };
    const loadingOption = { text: "Loading..." };

    const mockDiv = document.createElement("div");
    document.body.appendChild(mockDiv);

    const { rerender } = renderHook(() => {
      const hookResult = useEcharts({
        option,
        showLoading: true,
        loadingOption,
      });
      if (hookResult.chartRef.current !== mockDiv) {
        hookResult.chartRef.current = mockDiv;
      }
      return hookResult;
    });

    await act(async () => {
      rerender();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    });

    await waitFor(
      () => {
        expect(echarts.init).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    const mockInit = echarts.init as MockedFunction<typeof echarts.init>;
    const mockInstance = mockInit.mock.results[0]?.value as MockEChartsInstance;
    expect(mockInstance.showLoading).toHaveBeenCalledWith(loadingOption);

    // Cleanup
    document.body.removeChild(mockDiv);
  });

  // 测试事件处理
  it("should bind and unbind events correctly", async () => {
    const option: EChartsOption = { series: [{ type: "line" }] };
    const clickHandler = vi.fn();
    const onEvents = {
      click: {
        handler: clickHandler,
        query: ".series",
        context: {},
      },
    };

    const mockDiv = document.createElement("div");
    document.body.appendChild(mockDiv);

    const { rerender, unmount } = renderHook(() => {
      const hookResult = useEcharts({
        option,
        onEvents,
      });
      if (hookResult.chartRef.current !== mockDiv) {
        hookResult.chartRef.current = mockDiv;
      }
      return hookResult;
    });

    await act(async () => {
      rerender();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    });

    await waitFor(
      () => {
        expect(echarts.init).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    const mockInit = echarts.init as MockedFunction<typeof echarts.init>;
    const mockInstance = mockInit.mock.results[0]?.value as MockEChartsInstance;

    // Verify event binding
    expect(mockInstance.on).toHaveBeenCalledWith(
      "click",
      ".series",
      clickHandler,
      {}
    );

    // Test cleanup
    unmount();
    expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    expect(mockInstance.dispose).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(mockDiv);
  });

  // 测试实例获取
  it("should return undefined for getInstance before initialization", () => {
    const { result } = renderHook(() =>
      useEcharts({ option: {} as EChartsOption })
    );

    expect(result.current.getInstance()).toBeUndefined();
  });
});
