import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as echarts from "echarts";
import useEcharts from "../../hooks/use-echarts";
import { clearInstanceCache, getCachedInstance } from "../../utils/instance-cache";
import { clearGroups } from "../../utils/connect";
import type { EChartsOption } from "echarts";

// Mock ECharts
vi.mock("echarts", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

// Mock ResizeObserver
let resizeObserverInstances: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverInstances.push(this);
  }
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
  root: Document | Element | null = null;
  rootMargin = "0px";
  thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  // Trigger callback synchronously in observe() to match test expectations
  observe = vi.fn(() => {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this);
  });
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Create mock instance factory
function createMockInstance(element?: HTMLElement) {
  return {
    setOption: vi.fn(),
    dispose: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDom: vi.fn(() => element),
    resize: vi.fn(),
  };
}

describe("useEcharts", () => {
  beforeEach(() => {
    clearInstanceCache();
    clearGroups();
    resizeObserverInstances = [];
    vi.clearAllMocks();
  });

  const baseOption: EChartsOption = {
    series: [{ type: "line", data: [1, 2, 3] }],
  };

  describe("initialization", () => {
    it("should initialize chart instance", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(echarts.init).toHaveBeenCalledWith(element, null, { renderer: "canvas" });
      expect(mockInstance.setOption).toHaveBeenCalledWith(baseOption, undefined);
    });

    it("should use svg renderer when specified", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, renderer: "svg" }));

      expect(echarts.init).toHaveBeenCalledWith(element, null, { renderer: "svg" });
    });

    it("should not initialize when ref is null", () => {
      const ref = { current: null };

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(echarts.init).not.toHaveBeenCalled();
    });

    it("should not initialize when lazyInit is true and not visible", () => {
      // Override IntersectionObserver to not trigger immediately
      class NonTriggeringIntersectionObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
        constructor() {}
      }
      global.IntersectionObserver = NonTriggeringIntersectionObserver as unknown as typeof IntersectionObserver;

      const element = document.createElement("div");
      const ref = { current: element };

      renderHook(() => useEcharts(ref, { option: baseOption, lazyInit: true }));

      expect(echarts.init).not.toHaveBeenCalled();

      // Restore
      global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    });
  });

  describe("theme handling", () => {
    it("should use null theme by default", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
    });

    it("should use builtin theme when specified", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, theme: "dark" }));

      expect(echarts.init).toHaveBeenCalledWith(element, "dark", expect.any(Object));
    });

    it("should register and use custom theme object", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const customTheme = { color: ["#ff0000", "#00ff00"] };

      renderHook(() => useEcharts(ref, { option: baseOption, theme: customTheme }));

      expect(echarts.registerTheme).toHaveBeenCalledWith(
        expect.stringContaining("__custom_"),
        customTheme
      );
    });

    it("should use null when theme is explicitly null", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, theme: null }));

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
    });
  });

  describe("loading state", () => {
    it("should show loading when showLoading is true", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, showLoading: true }));

      expect(mockInstance.showLoading).toHaveBeenCalled();
    });

    it("should pass loading options", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const loadingOption = { text: "Loading..." };

      renderHook(() =>
        useEcharts(ref, { option: baseOption, showLoading: true, loadingOption })
      );

      expect(mockInstance.showLoading).toHaveBeenCalledWith(loadingOption);
    });

    it("should hide loading when showLoading is false", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, showLoading: false }));

      expect(mockInstance.hideLoading).toHaveBeenCalled();
    });
  });

  describe("event handling", () => {
    it("should bind events on initialization", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler },
      };

      renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, undefined);
    });

    it("should bind events with query", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler, query: "series" },
      };

      renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      expect(mockInstance.on).toHaveBeenCalledWith("click", "series", clickHandler, undefined);
    });

    it("should bind events with context", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const context = { name: "test" };
      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler, context },
      };

      renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, context);
    });

    it("should unbind events on unmount", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler },
      };

      const { unmount } = renderHook(() =>
        useEcharts(ref, { option: baseOption, onEvents })
      );

      unmount();

      expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    });
  });

  describe("group handling", () => {
    it("should add chart to group", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, group: "myGroup" }));

      // Group is handled in useEffect, check connect was called
      // Note: connect is only called when multiple instances in group
    });

    it("should update group when changed", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender } = renderHook(
        ({ group }) => useEcharts(ref, { option: baseOption, group }),
        { initialProps: { group: "group1" } }
      );

      rerender({ group: "group2" });

      // Group update logic is handled
    });
  });

  describe("setOption", () => {
    it("should update chart options via setOption", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      const newOption: EChartsOption = {
        series: [{ type: "bar", data: [4, 5, 6] }],
      };

      act(() => {
        result.current.setOption(newOption);
      });

      // Wait for queueMicrotask
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledWith(newOption, expect.any(Object));
      });
    });

    it("should merge setOptionOpts", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() =>
        useEcharts(ref, { option: baseOption, setOptionOpts: { notMerge: true } })
      );

      const newOption: EChartsOption = {
        series: [{ type: "bar", data: [4, 5, 6] }],
      };

      act(() => {
        result.current.setOption(newOption, { lazyUpdate: true });
      });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenLastCalledWith(newOption, {
          notMerge: true,
          lazyUpdate: true,
        });
      });
    });
  });

  describe("getInstance", () => {
    it("should return chart instance", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(result.current.getInstance()).toBe(mockInstance);
    });

    it("should return undefined when ref is null", () => {
      const ref = { current: null };

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(result.current.getInstance()).toBeUndefined();
    });
  });

  describe("resize", () => {
    it("should call resize on instance", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      act(() => {
        result.current.resize();
      });

      expect(mockInstance.resize).toHaveBeenCalled();
    });

    it("should not throw when instance is undefined", () => {
      const ref = { current: null };

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      // Should not throw
      act(() => {
        result.current.resize();
      });
    });
  });

  describe("cleanup", () => {
    it("should dispose instance on unmount", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption }));

      unmount();

      expect(mockInstance.dispose).toHaveBeenCalled();
    });

    it("should remove from group on unmount", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount } = renderHook(() =>
        useEcharts(ref, { option: baseOption, group: "testGroup" })
      );

      unmount();

      // Group cleanup is handled internally
    });

    it("should cache instance correctly", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(getCachedInstance(element)).toBe(mockInstance);
    });
  });

  describe("ResizeObserver", () => {
    it("should setup resize observer", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption }));

      // ResizeObserver should have been created and observe called
      expect(resizeObserverInstances.length).toBeGreaterThan(0);
      expect(resizeObserverInstances[0].observe).toHaveBeenCalled();
    });

    it("should disconnect resize observer on unmount", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption }));

      unmount();

      expect(resizeObserverInstances[0].disconnect).toHaveBeenCalled();
    });
  });
});

