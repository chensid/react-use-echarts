import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as echarts from "echarts";
import useEcharts from "../../hooks/use-echarts";
import {
  clearInstanceCache,
  getCachedInstance,
  setCachedInstance,
} from "../../utils/instance-cache";
import { clearGroups, getGroupInstances } from "../../utils/connect";
import type { EChartsOption } from "echarts";
import type { BuiltinTheme } from "../../types";
import { createMockInstance, MockResizeObserver, MockIntersectionObserver } from "../helpers";

// Mock ECharts
vi.mock("echarts", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

// Track ResizeObserver instances for specific tests
let resizeObserverInstances: MockResizeObserver[] = [];

class TrackingResizeObserver extends MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super(callback);
    resizeObserverInstances.push(this);
  }
}
globalThis.ResizeObserver = TrackingResizeObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

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
      globalThis.IntersectionObserver =
        NonTriggeringIntersectionObserver as unknown as typeof IntersectionObserver;

      const element = document.createElement("div");
      const ref = { current: element };

      renderHook(() => useEcharts(ref, { option: baseOption, lazyInit: true }));

      expect(echarts.init).not.toHaveBeenCalled();

      // Restore
      globalThis.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;
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
        customTheme,
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

      renderHook(() => useEcharts(ref, { option: baseOption, showLoading: true, loadingOption }));

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

    it("should keep loading state after theme change", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender } = renderHook<ReturnType<typeof useEcharts>, { theme: BuiltinTheme }>(
        ({ theme }) =>
          useEcharts(ref, {
            option: baseOption,
            theme,
            showLoading: true,
            loadingOption: { text: "Loading..." },
          }),
        { initialProps: { theme: "light" } },
      );

      rerender({ theme: "dark" });

      await waitFor(() => {
        expect(mockInstance2.showLoading).toHaveBeenCalledWith({ text: "Loading..." });
      });
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

      const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      unmount();

      expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    });

    it("should rebind events when onEvents changes", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler1 = vi.fn();
      const clickHandler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useEcharts(ref, { option: baseOption, onEvents: { click: { handler } } }),
        { initialProps: { handler: clickHandler1 } },
      );

      rerender({ handler: clickHandler2 });

      await waitFor(() => {
        expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler1);
        expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler2, undefined);
      });
    });
  });

  describe("group handling", () => {
    it("should add chart to group", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, group: "myGroup" }));

      await waitFor(() => {
        expect(getGroupInstances("myGroup")).toContain(mockInstance);
      });
    });

    it("should update group when changed", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender } = renderHook(
        ({ group }) => useEcharts(ref, { option: baseOption, group }),
        { initialProps: { group: "group1" } },
      );

      await waitFor(() => {
        expect(getGroupInstances("group1")).toContain(mockInstance);
      });

      rerender({ group: "group2" });

      await waitFor(() => {
        expect(getGroupInstances("group2")).toContain(mockInstance);
        expect(getGroupInstances("group1")).not.toContain(mockInstance);
      });
    });

    it("should keep group linkage after theme change", async () => {
      const element = document.createElement("div");
      const ref = { current: element };

      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);

      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender } = renderHook<ReturnType<typeof useEcharts>, { theme: BuiltinTheme }>(
        ({ theme }) =>
          useEcharts(ref, {
            option: baseOption,
            group: "myGroup",
            theme,
          }),
        { initialProps: { theme: "light" } },
      );

      await waitFor(() => {
        expect(getGroupInstances("myGroup")).toContain(mockInstance1);
      });

      rerender({ theme: "dark" });

      await waitFor(() => {
        const groupInstances = getGroupInstances("myGroup");
        expect(groupInstances).toContain(mockInstance2);
        expect(groupInstances).not.toContain(mockInstance1);
      });
    });

    it("should join group after lazy init enters viewport", async () => {
      const originalIntersectionObserver = globalThis.IntersectionObserver;
      let triggerIntersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

      class ControlledIntersectionObserver {
        root: Document | Element | null = null;
        rootMargin = "0px";
        thresholds: ReadonlyArray<number> = [0];
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
        takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);

        constructor(callback: IntersectionObserverCallback) {
          triggerIntersect = (entries) =>
            callback(
              entries as unknown as IntersectionObserverEntry[],
              this as unknown as IntersectionObserver,
            );
        }
      }

      globalThis.IntersectionObserver =
        ControlledIntersectionObserver as unknown as typeof IntersectionObserver;

      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, group: "lazyGroup", lazyInit: true }));

      // Not initialized before intersection
      expect(echarts.init).not.toHaveBeenCalled();

      // Simulate element entering viewport
      act(() => {
        triggerIntersect?.([{ isIntersecting: true } as { isIntersecting: boolean }]);
      });

      await waitFor(() => {
        expect(getGroupInstances("lazyGroup")).toContain(mockInstance);
      });

      globalThis.IntersectionObserver = originalIntersectionObserver;
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
        useEcharts(ref, { option: baseOption, setOptionOpts: { notMerge: true } }),
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

    it("should remove from group on unmount", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount } = renderHook(() =>
        useEcharts(ref, { option: baseOption, group: "testGroup" }),
      );

      await waitFor(() => {
        expect(getGroupInstances("testGroup")).toContain(mockInstance);
      });

      unmount();

      expect(getGroupInstances("testGroup")).not.toContain(mockInstance);
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

  describe("event shorthand API", () => {
    it("should bind function shorthand events", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: clickHandler,
      };

      renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, undefined);
    });

    it("should unbind function shorthand events on unmount", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = { click: clickHandler };

      const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      unmount();

      expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    });

    it("should support mixed shorthand and full config", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const mouseoverHandler = vi.fn();
      const onEvents = {
        click: clickHandler,
        mouseover: { handler: mouseoverHandler, query: "series" },
      };

      renderHook(() => useEcharts(ref, { option: baseOption, onEvents }));

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, undefined);
      expect(mockInstance.on).toHaveBeenCalledWith(
        "mouseover",
        "series",
        mouseoverHandler,
        undefined,
      );
    });
  });

  describe("option update error handling", () => {
    it("should call onError when setOption throws on option update", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const option1: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [4, 5, 6] }] };

      const { rerender } = renderHook(({ option }) => useEcharts(ref, { option, onError }), {
        initialProps: { option: option1 },
      });

      // Make setOption throw on the next call
      const error = new Error("setOption failed");
      mockInstance.setOption.mockImplementation(() => {
        throw error;
      });

      rerender({ option: option2 });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it("should console.error when no onError is provided on option update", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const option1: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [4, 5, 6] }] };

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { rerender } = renderHook(({ option }) => useEcharts(ref, { option }), {
        initialProps: { option: option1 },
      });

      const error = new Error("setOption failed");
      mockInstance.setOption.mockImplementation(() => {
        throw error;
      });

      rerender({ option: option2 });

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith("ECharts setOption failed:", error);
      });

      errorSpy.mockRestore();
    });
  });

  describe("lastAppliedRef reset on re-init", () => {
    it("should reapply same option object after theme-triggered re-init", async () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const stableOption: EChartsOption = {
        series: [{ type: "line", data: [1, 2, 3] }],
      };

      const { rerender } = renderHook(
        ({ theme }: { theme: BuiltinTheme }) => useEcharts(ref, { option: stableOption, theme }),
        { initialProps: { theme: "light" as BuiltinTheme } },
      );

      expect(mockInstance1.setOption).toHaveBeenCalledWith(stableOption, undefined);

      // Theme change triggers dispose + re-init
      rerender({ theme: "dark" as BuiltinTheme });

      // New instance must also get setOption even though option reference is same
      await waitFor(() => {
        expect(mockInstance2.setOption).toHaveBeenCalledWith(stableOption, undefined);
      });
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

    it("should gracefully handle ResizeObserver constructor failure", () => {
      const originalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        constructor() {
          throw new Error("ResizeObserver not supported");
        }
      } as unknown as typeof ResizeObserver;

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      // Should not throw
      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(warnSpy).toHaveBeenCalledWith("ResizeObserver not available:", expect.any(Error));

      warnSpy.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
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

    describe("RAF throttle", () => {
      const originalRAF = globalThis.requestAnimationFrame;
      const originalCAF = globalThis.cancelAnimationFrame;

      afterEach(() => {
        globalThis.requestAnimationFrame = originalRAF;
        globalThis.cancelAnimationFrame = originalCAF;
      });

      it("should resize chart when ResizeObserver fires (via RAF)", () => {
        const element = document.createElement("div");
        const ref = { current: element };
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
          cb(0);
          return 1;
        });

        renderHook(() => useEcharts(ref, { option: baseOption }));

        const observer = resizeObserverInstances[0] as unknown as MockResizeObserver;
        act(() => {
          observer.callback(
            [] as unknown as ResizeObserverEntry[],
            observer as unknown as ResizeObserver,
          );
        });

        expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
        expect(mockInstance.resize).toHaveBeenCalled();
      });

      it("should debounce rapid ResizeObserver callbacks via cancelAnimationFrame", () => {
        const element = document.createElement("div");
        const ref = { current: element };
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        let storedCallback: FrameRequestCallback | undefined;
        let nextId = 1;
        globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
          storedCallback = cb;
          return nextId++;
        });
        globalThis.cancelAnimationFrame = vi.fn();

        renderHook(() => useEcharts(ref, { option: baseOption }));

        const observer = resizeObserverInstances[0] as unknown as MockResizeObserver;

        // Fire twice rapidly
        act(() => {
          observer.callback(
            [] as unknown as ResizeObserverEntry[],
            observer as unknown as ResizeObserver,
          );
          observer.callback(
            [] as unknown as ResizeObserverEntry[],
            observer as unknown as ResizeObserver,
          );
        });

        // Second call should have cancelled the first RAF
        expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(1);
        expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(2);

        // Execute the final RAF callback
        storedCallback?.(0);
        expect(mockInstance.resize).toHaveBeenCalledTimes(1);
      });

      it("should cancel pending RAF on unmount", () => {
        const element = document.createElement("div");
        const ref = { current: element };
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        globalThis.requestAnimationFrame = vi.fn(() => 42);
        globalThis.cancelAnimationFrame = vi.fn();

        const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption }));

        const observer = resizeObserverInstances[0] as unknown as MockResizeObserver;
        act(() => {
          observer.callback(
            [] as unknown as ResizeObserverEntry[],
            observer as unknown as ResizeObserver,
          );
        });

        unmount();

        expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);
      });
    });

    it("should not create resize observer when autoResize is false", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, autoResize: false }));

      expect(resizeObserverInstances).toHaveLength(0);
    });
  });

  describe("initOpts", () => {
    it("should pass initOpts to echarts.init", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() =>
        useEcharts(ref, {
          option: baseOption,
          initOpts: { devicePixelRatio: 2, locale: "ZH" },
        }),
      );

      expect(echarts.init).toHaveBeenCalledWith(element, null, {
        renderer: "canvas",
        devicePixelRatio: 2,
        locale: "ZH",
      });
    });
  });

  describe("non-builtin string theme", () => {
    it("should pass non-builtin string theme through to echarts.init", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      renderHook(() => useEcharts(ref, { option: baseOption, theme: "custom-theme-string" }));

      // resolveThemeName should pass any string theme through
      expect(echarts.init).toHaveBeenCalledWith(element, "custom-theme-string", expect.any(Object));
    });

    it("should treat unexpected theme type (e.g. number) as null", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      // Force a non-string, non-object, non-null theme to exercise the defensive fallback
      renderHook(() => useEcharts(ref, { option: baseOption, theme: 42 as never }));

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
    });
  });

  describe("circular reference theme", () => {
    it("should handle circular reference theme object without throwing", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const circularTheme: Record<string, unknown> = { color: ["#abc"] };
      circularTheme.self = circularTheme;

      renderHook(() => useEcharts(ref, { option: baseOption, theme: circularTheme }));

      expect(echarts.init).toHaveBeenCalled();
    });

    it("should reuse cached key when same circular theme is used in a new hook instance", () => {
      const circularTheme: Record<string, unknown> = { color: ["#def"] };
      circularTheme.self = circularTheme;

      // First hook instance — registers the circular theme ID
      const el1 = document.createElement("div");
      const ref1 = { current: el1 };
      const mock1 = createMockInstance(el1);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mock1);

      const { unmount } = renderHook(() =>
        useEcharts(ref1, { option: baseOption, theme: circularTheme }),
      );
      unmount();

      // Second hook instance — should hit WeakMap cache for the same circular theme
      const el2 = document.createElement("div");
      const ref2 = { current: el2 };
      const mock2 = createMockInstance(el2);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mock2);

      renderHook(() => useEcharts(ref2, { option: baseOption, theme: circularTheme }));

      expect(echarts.init).toHaveBeenCalled();
    });
  });

  describe("init error handling", () => {
    it("should call onError when echarts.init throws", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const initError = new Error("init failed");
      (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw initError;
      });

      const onError = vi.fn();
      renderHook(() => useEcharts(ref, { option: baseOption, onError }));

      expect(onError).toHaveBeenCalledWith(initError);
    });

    it("should console.error when echarts.init throws without onError", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const initError = new Error("init failed");
      (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw initError;
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(errorSpy).toHaveBeenCalledWith("ECharts init failed:", initError);
      errorSpy.mockRestore();
    });

    it("should call onError when initial setOption throws", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      const setOptionError = new Error("initial setOption failed");
      // Only throw once (during init effect), then succeed (for Effect 2)
      mockInstance.setOption
        .mockImplementationOnce(() => {
          throw setOptionError;
        })
        .mockImplementation(() => {});
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      renderHook(() => useEcharts(ref, { option: baseOption, onError }));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(setOptionError);
    });

    it("should console.error when initial setOption throws without onError", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      const setOptionError = new Error("initial setOption failed");
      // Only throw once (during init effect), then succeed (for Effect 2)
      mockInstance.setOption
        .mockImplementationOnce(() => {
          throw setOptionError;
        })
        .mockImplementation(() => {});
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      renderHook(() => useEcharts(ref, { option: baseOption }));

      expect(errorSpy).toHaveBeenCalledWith("ECharts setOption failed:", setOptionError);
      errorSpy.mockRestore();
    });
  });

  describe("imperative setOption error handling", () => {
    it("should call onError when imperative setOption throws", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts(ref, { option: baseOption, onError }));

      const error = new Error("imperative setOption failed");
      mockInstance.setOption.mockImplementation(() => {
        throw error;
      });

      act(() => {
        result.current.setOption({ series: [] });
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should rethrow when imperative setOption throws without onError", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      mockInstance.setOption.mockImplementation(() => {
        throw new Error("imperative setOption failed");
      });

      expect(() => {
        result.current.setOption({ series: [] });
      }).toThrow("imperative setOption failed");
    });

    it("should do nothing when imperative setOption is called without instance", () => {
      const ref = { current: null };

      const { result } = renderHook(() => useEcharts(ref, { option: baseOption }));

      // Should not throw — early return because no instance
      act(() => {
        result.current.setOption({ series: [] });
      });
    });
  });

  describe("cache hit on init", () => {
    it("should reuse existing cached instance instead of calling echarts.init", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const existingInstance = createMockInstance(element);

      // Pre-populate the cache as if another hook already owns this element
      setCachedInstance(element, existingInstance as never);

      renderHook(() => useEcharts(ref, { option: baseOption }));

      // echarts.init should NOT be called since the cache already had an instance
      expect(echarts.init).not.toHaveBeenCalled();
      // The existing instance should still be used (setOption called on it)
      expect(existingInstance.setOption).toHaveBeenCalledWith(baseOption, undefined);
    });
  });

  describe("cleanup edge cases", () => {
    it("should handle cleanup when instance is already gone", () => {
      const element = document.createElement("div");
      const ref = { current: element };
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount } = renderHook(() => useEcharts(ref, { option: baseOption }));

      // Clear the cache before unmounting so cleanup finds no instance
      clearInstanceCache();

      // Should not throw
      unmount();
    });
  });
});
