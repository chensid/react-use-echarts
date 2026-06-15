import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as echarts from "echarts/core";
import { useEcharts } from "../../hooks/use-echarts";
import {
  clearInstanceCache,
  getCachedInstance,
  setCachedInstance,
} from "../../utils/instance-cache";
import { clearGroups, getGroupInstances } from "../../utils/connect";
import type { EChartsOption } from "echarts";
import type { BuiltinTheme } from "../../types";
import { __clearThemeCacheForTesting__ } from "../../themes";
import { registerBuiltinThemes } from "../../themes/registry";
import { __resetVisibilityCoordinatorForTesting__ } from "../../utils/visibility-coordinator";
import { createMockInstance, MockResizeObserver, MockIntersectionObserver } from "../helpers";
import { resetDevWarnings } from "../../utils/dev-warnings";

// Mock ECharts
vi.mock("echarts/core", () => ({
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
    __clearThemeCacheForTesting__();
    __resetVisibilityCoordinatorForTesting__();
    resizeObserverInstances = [];
    vi.clearAllMocks();
  });

  const baseOption: EChartsOption = {
    series: [{ type: "line", data: [1, 2, 3] }],
  };

  describe("initialization", () => {
    it("should initialize chart instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, null, { renderer: "canvas" });
      expect(mockInstance.setOption).toHaveBeenCalledWith(baseOption, undefined);
    });

    it("should warn in development when container size is zero", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("chart container has zero width or height during initialization"),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should not warn in development when container size is non-zero", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        Object.defineProperty(element, "getBoundingClientRect", {
          value: vi.fn(() => ({
            width: 640,
            height: 400,
            top: 0,
            right: 640,
            bottom: 400,
            left: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          })),
        });
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should skip the zero-size warning if getBoundingClientRect throws", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        Object.defineProperty(element, "getBoundingClientRect", {
          value: vi.fn(() => {
            throw new Error("detached element");
          }),
        });
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(() => {
          act(() => {
            result.current.ref(element);
          });
        }).not.toThrow();
        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("chart container has zero width or height during initialization"),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should use svg renderer when specified", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, renderer: "svg" }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, null, { renderer: "svg" });
    });

    it("should not initialize when ref is null", () => {
      renderHook(() => useEcharts({ option: baseOption }));

      expect(echarts.init).not.toHaveBeenCalled();
    });

    it("should expose a reactive instance field", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      // Before any ref attachment, no instance exists.
      expect(result.current.instance).toBeUndefined();

      // Attaching the callback ref creates the instance reactively — the
      // field flips to the live ECharts instance after the next commit.
      act(() => {
        result.current.ref(element);
      });
      expect(result.current.instance).toBe(mockInstance);

      // Clearing the ref (e.g. when the container unmounts) tears the
      // instance down and the field flips back to undefined.
      act(() => {
        result.current.ref(null);
      });
      expect(result.current.instance).toBeUndefined();
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

      const { result } = renderHook(() => useEcharts({ option: baseOption, lazyInit: true }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).not.toHaveBeenCalled();

      // Restore
      globalThis.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;
    });

    it("should recreate the instance when ref.current changes to a new element", async () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      const option1: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [4, 5, 6] }] };
      const onClick = vi.fn();
      const mockInstance1 = createMockInstance(element1);
      const mockInstance2 = createMockInstance(element2);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { result, rerender } = renderHook(
        ({ option }) =>
          useEcharts({
            option,
            group: "swapGroup",
            showLoading: true,
            onEvents: { click: onClick },
          }),
        { initialProps: { option: option1 } },
      );
      act(() => {
        result.current.ref(element1);
      });

      await waitFor(() => {
        expect(getCachedInstance(element1)).toBe(mockInstance1);
      });

      act(() => {
        result.current.ref(element2);
      });
      rerender({ option: option2 });

      await waitFor(() => {
        expect(getCachedInstance(element2)).toBe(mockInstance2);
      });

      expect(mockInstance1.dispose).toHaveBeenCalledTimes(1);
      expect(getCachedInstance(element1)).toBeUndefined();
      expect(result.current.instance).toBe(mockInstance2);
      expect(mockInstance2.setOption).toHaveBeenCalledWith(option2, undefined);
      expect(mockInstance2.showLoading).toHaveBeenCalled();
      expect(mockInstance2.on).toHaveBeenCalledWith("click", onClick, undefined);
      expect(getGroupInstances("swapGroup")).toContain(mockInstance2);
      expect(getGroupInstances("swapGroup")).not.toContain(mockInstance1);
    });
  });

  describe("theme handling", () => {
    it("should use null theme by default", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
    });

    it("should use builtin theme when specified", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, theme: "dark" }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, "dark", expect.any(Object));
    });

    it("should warn in development when a builtin theme is used before registration", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      try {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() => useEcharts({ option: baseOption, theme: "dark" }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('built-in theme "dark" was not registered'),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should warn in development when a string theme is neither built-in nor registered", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      try {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() =>
          useEcharts({ option: baseOption, theme: "externally-registered-theme" }),
        );
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'theme "externally-registered-theme" is not built-in and was not registered',
          ),
        );
        // The name still reaches echarts.init untouched — the warning is advisory.
        expect(echarts.init).toHaveBeenCalledWith(
          element,
          "externally-registered-theme",
          expect.any(Object),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should not warn for a builtin theme after registry registration", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      try {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        registerBuiltinThemes();
        const { result } = renderHook(() => useEcharts({ option: baseOption, theme: "dark" }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('built-in theme "dark" was not registered'),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should register and use custom theme object", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const customTheme = { color: ["#ff0000", "#00ff00"] };

      const { result } = renderHook(() => useEcharts({ option: baseOption, theme: customTheme }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.registerTheme).toHaveBeenCalledWith(
        expect.stringContaining("__custom_"),
        customTheme,
      );
    });

    it("should treat runtime theme=null as default theme without throwing", () => {
      // Public TS type forbids null, but JS callers (or escape hatches) can still
      // pass it. typeof null === "object", so without the nullish guard
      // resolveThemeName would route into the custom-theme path and crash.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      expect(() => {
        const { result } = renderHook(() =>
          useEcharts({
            option: baseOption,
            // Bypass TS type to simulate a JS caller passing null.
            theme: null as unknown as undefined,
            onError,
          }),
        );
        act(() => {
          result.current.ref(element);
        });
      }).not.toThrow();

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
      expect(echarts.registerTheme).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("should show loading when showLoading is true", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, showLoading: true }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.showLoading).toHaveBeenCalled();
    });

    it("should pass loading options", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const loadingOption = { text: "Loading..." };

      const { result } = renderHook(() =>
        useEcharts({ option: baseOption, showLoading: true, loadingOption }),
      );
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.showLoading).toHaveBeenCalledWith(loadingOption);
    });

    it("should not call hideLoading on initial mount when showLoading is false", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, showLoading: false }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.hideLoading).not.toHaveBeenCalled();
      expect(mockInstance.showLoading).not.toHaveBeenCalled();
    });

    it("should hide loading when showLoading transitions from true to false", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender, result } = renderHook<
        ReturnType<typeof useEcharts>,
        { showLoading: boolean }
      >(({ showLoading }) => useEcharts({ option: baseOption, showLoading }), {
        initialProps: { showLoading: true },
      });
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.showLoading).toHaveBeenCalledTimes(1);
      expect(mockInstance.hideLoading).not.toHaveBeenCalled();

      rerender({ showLoading: false });
      expect(mockInstance.hideLoading).toHaveBeenCalledTimes(1);
    });

    it("should not re-call showLoading for inline loadingOption with identical content", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender, result } = renderHook(() =>
        useEcharts({
          option: baseOption,
          showLoading: true,
          loadingOption: { text: "Loading..." },
        }),
      );
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.showLoading).toHaveBeenCalledTimes(1);
      rerender();
      rerender();
      expect(mockInstance.showLoading).toHaveBeenCalledTimes(1);
    });

    it("should keep loading state after theme change", async () => {
      const element = document.createElement("div");
      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender, result } = renderHook<
        ReturnType<typeof useEcharts>,
        { theme: BuiltinTheme }
      >(
        ({ theme }) =>
          useEcharts({
            option: baseOption,
            theme,
            showLoading: true,
            loadingOption: { text: "Loading..." },
          }),
        { initialProps: { theme: "light" } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ theme: "dark" });

      await waitFor(() => {
        expect(mockInstance2.showLoading).toHaveBeenCalledWith({ text: "Loading..." });
      });
    });

    it("should keep loading state after theme change without loadingOption", async () => {
      const element = document.createElement("div");
      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender, result } = renderHook<
        ReturnType<typeof useEcharts>,
        { theme: BuiltinTheme }
      >(
        ({ theme }) =>
          useEcharts({
            option: baseOption,
            theme,
            showLoading: true,
          }),
        { initialProps: { theme: "light" } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ theme: "dark" });

      await waitFor(() => {
        expect(mockInstance2.showLoading).toHaveBeenCalled();
      });
    });

    it("should update loadingOption when showLoading remains true", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const optionA = { text: "Loading A" };
      const optionB = { text: "Loading B" };

      const { rerender, result } = renderHook(
        ({ loadingOption }) => useEcharts({ option: baseOption, showLoading: true, loadingOption }),
        { initialProps: { loadingOption: optionA } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ loadingOption: optionB });

      await waitFor(() => {
        expect(mockInstance.showLoading).toHaveBeenLastCalledWith(optionB);
      });
    });

    it("should route loading toggle errors through onError", async () => {
      // showLoading can throw via user-registered custom loading types
      // (echarts.registerLoading('name', renderFn) — renderFn under user control).
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const loadingError = new Error("custom loading renderer threw");
      mockInstance.showLoading.mockImplementation(() => {
        throw loadingError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { rerender, result } = renderHook<
        ReturnType<typeof useEcharts>,
        { showLoading: boolean }
      >(({ showLoading }) => useEcharts({ option: baseOption, showLoading, onError }), {
        initialProps: { showLoading: false },
      });
      act(() => {
        result.current.ref(element);
      });

      rerender({ showLoading: true });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(loadingError);
      });
    });

    it("should route initial showLoading errors through onError without breaking cleanup", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const loadingError = new Error("initial showLoading failed");
      mockInstance.showLoading.mockImplementation(() => {
        throw loadingError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { unmount, result } = renderHook(() =>
        useEcharts({ option: baseOption, showLoading: true, onError }),
      );
      act(() => {
        result.current.ref(element);
      });

      // A bare throw in the lifecycle effect would skip the cleanup return
      // and leak the cached instance. Routing through onError keeps the
      // return reachable so unmount can dispose.
      expect(onError).toHaveBeenCalledWith(loadingError);

      unmount();
      expect(mockInstance.dispose).toHaveBeenCalled();
    });
  });

  describe("event handling", () => {
    it("should bind events on initialization", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, undefined);
    });

    it("should bind events with query", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler, query: "series" },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", "series", clickHandler, undefined);
    });

    it("should bind events with object query", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const query = { seriesIndex: 0 };
      const onEvents = {
        click: { handler: clickHandler, query },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", query, clickHandler, undefined);
    });

    it("should bind events with empty string query", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler, query: "" },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", "", clickHandler, undefined);
    });

    it("should bind events with context", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const context = { name: "test" };
      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler, context },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, context);
    });

    it("should unbind events on unmount", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: { handler: clickHandler },
      };

      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      unmount();

      expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    });

    it("should route initial event bind errors through onError without breaking cleanup", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const bindError = new Error("on() failed");
      mockInstance.on.mockImplementation(() => {
        throw bindError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { unmount, result } = renderHook(() =>
        useEcharts({
          option: baseOption,
          onEvents: { click: () => {} },
          onError,
        }),
      );
      act(() => {
        result.current.ref(element);
      });

      expect(onError).toHaveBeenCalledWith(bindError);

      unmount();
      expect(mockInstance.dispose).toHaveBeenCalled();
    });

    it("should rebind events when onEvents changes", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler1 = vi.fn();
      const clickHandler2 = vi.fn();

      const { rerender, result } = renderHook(
        ({ handler }) => useEcharts({ option: baseOption, onEvents: { click: { handler } } }),
        { initialProps: { handler: clickHandler1 } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ handler: clickHandler2 });

      await waitFor(() => {
        expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler1);
        expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler2, undefined);
      });
    });

    it("should route dynamic rebind bind errors through onError", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const bindError = new Error("rebind on() failed");

      // First mount binds handler1 successfully; rerender with handler2 fails on bind.
      mockInstance.on.mockImplementationOnce(() => {});
      mockInstance.on.mockImplementationOnce(() => {
        throw bindError;
      });

      const onError = vi.fn();
      const { rerender, result } = renderHook(
        ({ handler }) =>
          useEcharts({ option: baseOption, onEvents: { click: { handler } }, onError }),
        { initialProps: { handler: handler1 } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ handler: handler2 });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(bindError);
      });
      // The old handler must still have been off()'d so it doesn't double-fire.
      expect(mockInstance.off).toHaveBeenCalledWith("click", handler1);
    });

    it("should clear bound events when onEvents transitions to undefined", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const handler = vi.fn();

      const { rerender, unmount, result } = renderHook(
        ({ events }: { events: { click: typeof handler } | undefined }) =>
          useEcharts({ option: baseOption, onEvents: events }),
        { initialProps: { events: { click: handler } as { click: typeof handler } | undefined } },
      );
      act(() => {
        result.current.ref(element);
      });

      // Drop onEvents — must off the previously-bound handler so cleanup
      // becomes a no-op afterward.
      rerender({ events: undefined });
      await waitFor(() => {
        expect(mockInstance.off).toHaveBeenCalledWith("click", handler);
      });

      mockInstance.off.mockClear();
      unmount();
      // Cleanup with nothing bound shouldn't make any more off() calls.
      expect(mockInstance.off).not.toHaveBeenCalled();
    });

    it("should unbind old events before binding when the handler reference is reused", async () => {
      // ECharts off(name, handler) ignores query/context — so a same-handler
      // rebind from query A → query B must off() BEFORE on(); otherwise the
      // unbind would remove the freshly-bound handler.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const handler = vi.fn();
      const sequence: string[] = [];
      mockInstance.on.mockImplementation((..._args: unknown[]) => {
        sequence.push("on");
      });
      mockInstance.off.mockImplementation((..._args: unknown[]) => {
        sequence.push("off");
      });

      const { rerender, result } = renderHook(
        ({ query }) =>
          useEcharts({
            option: baseOption,
            onEvents: { click: { handler, query } },
          }),
        { initialProps: { query: "series0" } },
      );
      act(() => {
        result.current.ref(element);
      });

      // Initial mount: just on().
      expect(sequence).toEqual(["on"]);

      rerender({ query: "series1" });

      await waitFor(() => {
        // Rebind path must run off() before the new on().
        expect(sequence).toEqual(["on", "off", "on"]);
      });
      expect(mockInstance.off).toHaveBeenLastCalledWith("click", handler);
      expect(mockInstance.on).toHaveBeenLastCalledWith("click", "series1", handler, undefined);
    });

    it("should still release the cached instance when cleanup unbind throws", () => {
      // Cleanup correctness: unbind throwing must not skip release. off()
      // doesn't throw on real ECharts, but the structural try/catch +
      // try/finally guarantees release happens regardless.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const unbindError = new Error("cleanup off() failed");

      const onError = vi.fn();
      const { unmount, result } = renderHook(() =>
        useEcharts({ option: baseOption, onEvents: { click: () => {} }, onError }),
      );
      act(() => {
        result.current.ref(element);
      });

      // Arm the off() to throw only on the cleanup path — the initial mount
      // path doesn't call off().
      mockInstance.off.mockImplementation(() => {
        throw unbindError;
      });

      expect(() => unmount()).not.toThrow();
      expect(onError).toHaveBeenCalledWith(unbindError);
      expect(mockInstance.dispose).toHaveBeenCalled();
    });

    it("should route release failures through onError without breaking unmount", () => {
      // releaseCachedInstance propagates leaveGroup/dispose failures so
      // callers can route them. Hook cleanup wraps the call so a thrown
      // error doesn't disrupt React commit at unmount.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const disposeError = new Error("dispose failed");
      mockInstance.dispose.mockImplementation(() => {
        throw disposeError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      expect(() => unmount()).not.toThrow();
      expect(onError).toHaveBeenCalledWith(disposeError);
      // Cache bookkeeping ran inside instance-cache's finally even though
      // dispose threw, so the entry is gone.
      expect(getCachedInstance(element)).toBeUndefined();
    });
  });

  describe("group handling", () => {
    it("should add chart to group", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, group: "myGroup" }));
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(getGroupInstances("myGroup")).toContain(mockInstance);
      });
    });

    it("should update group when changed", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender, result } = renderHook(
        ({ group }) => useEcharts({ option: baseOption, group }),
        { initialProps: { group: "group1" } },
      );
      act(() => {
        result.current.ref(element);
      });

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

      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);

      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender, result } = renderHook<
        ReturnType<typeof useEcharts>,
        { theme: BuiltinTheme }
      >(
        ({ theme }) =>
          useEcharts({
            option: baseOption,
            group: "myGroup",
            theme,
          }),
        { initialProps: { theme: "light" } },
      );
      act(() => {
        result.current.ref(element);
      });

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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() =>
        useEcharts({ option: baseOption, group: "lazyGroup", lazyInit: true }),
      );
      act(() => {
        result.current.ref(element);
      });

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

    it("should route initial group assignment errors through onError", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const connectError = new Error("connect failed");
      (echarts.connect as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw connectError;
      });
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useEcharts({ option: baseOption, group: "errGroup", onError }),
      );
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(connectError);
      });
    });

    it("should route dynamic group switch errors through onError", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      // First connect (initial group) succeeds; the switch's connect throws.
      const switchError = new Error("connect failed on switch");
      (echarts.connect as ReturnType<typeof vi.fn>)
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
          throw switchError;
        });
      const onError = vi.fn();

      const { rerender, result } = renderHook(
        ({ group }) => useEcharts({ option: baseOption, group, onError }),
        { initialProps: { group: "g1" } },
      );
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(getGroupInstances("g1")).toContain(mockInstance);
      });

      rerender({ group: "g2" });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(switchError);
      });
    });

    it("should switch group by library intent even if instance.group was tampered with", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { rerender, result } = renderHook(
        ({ group }) => useEcharts({ option: baseOption, group }),
        { initialProps: { group: "g1" } },
      );
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(getGroupInstances("g1")).toContain(mockInstance);
      });

      // A consumer reaches into the live instance and overwrites the writable
      // `group` property out from under the hook.
      (mockInstance as unknown as { group: string }).group = "tampered";

      rerender({ group: "g2" });

      await waitFor(() => {
        expect(getGroupInstances("g2")).toContain(mockInstance);
      });
      // Must have been removed from the group WE assigned ("g1"), not from the
      // tampered id — otherwise it leaks in g1's bookkeeping. (Reading
      // instance.group instead of lastGroupRef would removeFromGroup("tampered")
      // and leave the instance stranded in g1.)
      expect(getGroupInstances("g1")).not.toContain(mockInstance);
    });
  });

  describe("setOption", () => {
    it("should update chart options via setOption", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() =>
        useEcharts({ option: baseOption, setOptionOpts: { notMerge: true } }),
      );
      act(() => {
        result.current.ref(element);
      });

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

    it("should skip setOption when rerender option is shallow-equal", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const sharedSeries = baseOption.series;
      const option1: EChartsOption = { series: sharedSeries };
      const option2: EChartsOption = { series: sharedSeries };

      const { rerender, result } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: option1 },
      });
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      rerender({ option: option2 });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });
    });

    it("should skip setOption for shallow-equal option with multiple top-level keys", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const multiKeyOption: EChartsOption = {
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed"] },
        yAxis: { type: "value" },
        series: [{ type: "line", data: [1, 2, 3] }],
      };
      const option1: EChartsOption = { ...multiKeyOption };
      const option2: EChartsOption = { ...multiKeyOption };

      const { rerender, result } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: option1 },
      });
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      rerender({ option: option2 });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });
    });

    it("should take reference-equality fast path when option and setOptionOpts refs are identical", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const stableOption: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const stableOpts = { notMerge: false };

      const { rerender, result } = renderHook(
        ({ option, opts }) => useEcharts({ option, setOptionOpts: opts }),
        { initialProps: { option: stableOption, opts: stableOpts } },
      );
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      rerender({ option: stableOption, opts: stableOpts });
      rerender({ option: stableOption, opts: stableOpts });
      rerender({ option: stableOption, opts: stableOpts });

      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      // Control: changing setOptionOpts value (not shallow-equal) must trigger setOption again
      rerender({ option: stableOption, opts: { notMerge: true } });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(2);
      });
    });

    it("should keep prop dedup consistent after imperative setOption", async () => {
      // Imperative setOption must update lastAppliedRef so the subsequent
      // prop-driven OPTION-SYNC effect sees the actual instance state, not a
      // stale "what props sent last".
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const sharedSeries = baseOption.series;
      const propOptionA: EChartsOption = { series: sharedSeries };
      const propOptionAEqual: EChartsOption = { series: sharedSeries };
      const imperativeOption: EChartsOption = { series: [{ type: "bar", data: [9] }] };

      const { result, rerender } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: propOptionA },
      });
      act(() => {
        result.current.ref(element);
      });

      // 1. Init applied propOptionA.
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      // 2. Imperative call switches the chart to a different option.
      act(() => {
        result.current.setOption(imperativeOption);
      });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(2);
        expect(mockInstance.setOption).toHaveBeenLastCalledWith(
          imperativeOption,
          expect.any(Object),
        );
      });

      // 3. Re-render with a fresh prop ref shallow-equal to propOptionA.
      //    Without the fix: lastAppliedRef stale at A → shallowEqual(A, A_new)
      //    skips, chart keeps the imperative option (silently wrong).
      //    With the fix: lastAppliedRef holds the imperative option → diff
      //    against the new prop → re-applies the prop option, restoring it.
      rerender({ option: propOptionAEqual });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(3);
        expect(mockInstance.setOption).toHaveBeenLastCalledWith(propOptionAEqual, undefined);
      });
    });
  });

  describe("instance field", () => {
    it("should return chart instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.ref(element);
      });

      expect(result.current.instance).toBe(mockInstance);
    });

    it("should return undefined when ref is null", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      expect(result.current.instance).toBeUndefined();
    });
  });

  describe("method identity stability", () => {
    // Regression: useChartCore wraps its imperative API in useMemo([element]),
    // and useEcharts spreads it into a Compiler-cached return literal. The net
    // effect is that consumers can place `setOption` (and friends) into effect
    // dependency arrays without thrashing — for example,
    // `useEffect(() => { setInterval(setOption, …) }, [running, setOption])`
    // must not recreate the interval on every parent render.
    it("keeps imperative method identities stable across unrelated rerenders", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result, rerender } = renderHook(
        ({ tick }) => {
          // `tick` is unrelated to the chart — just forces a rerender.
          void tick;
          return useEcharts({ option: baseOption });
        },
        {
          initialProps: { tick: 0 },
        },
      );
      act(() => {
        result.current.ref(element);
      });

      const beforeSetOption = result.current.setOption;
      const beforeResize = result.current.resize;
      const beforeDispatchAction = result.current.dispatchAction;
      const beforeClear = result.current.clear;
      const beforeAppendData = result.current.appendData;
      const beforeRef = result.current.ref;

      rerender({ tick: 1 });
      rerender({ tick: 2 });
      rerender({ tick: 3 });

      expect(result.current.setOption).toBe(beforeSetOption);
      expect(result.current.resize).toBe(beforeResize);
      expect(result.current.dispatchAction).toBe(beforeDispatchAction);
      expect(result.current.clear).toBe(beforeClear);
      expect(result.current.appendData).toBe(beforeAppendData);
      expect(result.current.ref).toBe(beforeRef);
    });
  });

  describe("resize", () => {
    it("should call resize on instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.resize();
      });

      expect(mockInstance.resize).toHaveBeenCalled();
    });

    it("should not throw when instance is undefined", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      // Should not throw
      act(() => {
        result.current.resize();
      });
    });

    it("should route resize errors through onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const resizeError = new Error("resize failed");
      mockInstance.resize.mockImplementation(() => {
        throw resizeError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.resize();
      });

      expect(onError).toHaveBeenCalledWith(resizeError);
    });

    it("should rethrow resize errors when no onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      mockInstance.resize.mockImplementation(() => {
        throw new Error("resize boom");
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(() => {
        act(() => {
          result.current.resize();
        });
      }).toThrow("resize boom");
    });

    it("should forward ResizeOpts to instance.resize", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      const opts = { width: 800, height: 600, silent: true };
      act(() => {
        result.current.resize(opts);
      });

      expect(mockInstance.resize).toHaveBeenCalledWith(opts);
    });
  });

  describe("dispatchAction", () => {
    it("should forward payload to instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      const payload = { type: "highlight", seriesIndex: 0 };
      act(() => {
        result.current.dispatchAction(payload);
      });

      expect(mockInstance.dispatchAction).toHaveBeenCalledWith(payload, undefined);
    });

    it("should forward opts argument", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      const payload = { type: "showTip", seriesIndex: 0, dataIndex: 1 };
      act(() => {
        result.current.dispatchAction(payload, { silent: true });
      });

      expect(mockInstance.dispatchAction).toHaveBeenCalledWith(payload, { silent: true });
    });

    it("should be a no-op when instance is not initialized", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      // Should not throw
      act(() => {
        result.current.dispatchAction({ type: "highlight" });
      });
    });

    it("should route dispatch errors through onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const dispatchError = new Error("invalid action");
      mockInstance.dispatchAction.mockImplementation(() => {
        throw dispatchError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.dispatchAction({ type: "broken" });
      });

      expect(onError).toHaveBeenCalledWith(dispatchError);
    });

    it("should rethrow dispatch errors when no onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      mockInstance.dispatchAction.mockImplementation(() => {
        throw new Error("boom");
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(() => {
        act(() => {
          result.current.dispatchAction({ type: "broken" });
        });
      }).toThrow("boom");
    });
  });

  describe("clear", () => {
    it("should call clear on instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.clear();
      });

      expect(mockInstance.clear).toHaveBeenCalled();
    });

    it("should not throw when instance is undefined", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      act(() => {
        result.current.clear();
      });
    });

    it("should route clear errors through onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const clearError = new Error("clear failed");
      mockInstance.clear.mockImplementation(() => {
        throw clearError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      act(() => {
        result.current.clear();
      });

      expect(onError).toHaveBeenCalledWith(clearError);
    });

    it("should rethrow clear errors when no onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      mockInstance.clear.mockImplementation(() => {
        throw new Error("clear boom");
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(() => {
        act(() => {
          result.current.clear();
        });
      }).toThrow("clear boom");
    });

    it("should re-apply prop option after imperative clear when rerender is shallow-equal", async () => {
      // Without resetting lastAppliedRef inside clear(), the option-sync
      // effect's dedup fast path sees an unchanged option vs lastApplied and
      // skips setOption, leaving the chart blank after clear(). Resetting
      // forces re-application.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const sharedSeries = baseOption.series;
      const propOptionA: EChartsOption = { series: sharedSeries };
      const propOptionAEqual: EChartsOption = { series: sharedSeries };

      const { result, rerender } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: propOptionA },
      });
      act(() => {
        result.current.ref(element);
      });

      // 1. Init applied propOptionA.
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      // 2. Imperative clear() — chart is now blank; lastAppliedRef must be cleared.
      act(() => {
        result.current.clear();
      });
      expect(mockInstance.clear).toHaveBeenCalledTimes(1);

      // 3. Rerender with a fresh ref shallow-equal to propOptionA. The dedup
      //    fast path would skip without the fix; with the fix lastAppliedRef
      //    is null, so setOption is invoked again to restore the chart.
      rerender({ option: propOptionAEqual });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(2);
        expect(mockInstance.setOption).toHaveBeenLastCalledWith(propOptionAEqual, undefined);
      });
    });
  });

  describe("appendData", () => {
    it("should forward params to instance", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      const params = { seriesIndex: 0, data: [1, 2, 3] };
      act(() => {
        result.current.appendData(params);
      });
      expect(mockInstance.appendData).toHaveBeenCalledWith(params);
    });

    it("should not throw when instance is not initialized", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      expect(() => {
        act(() => {
          result.current.appendData({ seriesIndex: 0, data: [] });
        });
      }).not.toThrow();
    });

    it("should reset dedup memory so a shallow-equal-new-ref rerender re-applies setOption", async () => {
      // Same drift mechanic as clear(): appendData mutates instance state
      // outside the declarative option, so the next prop rerender that is
      // shallow-equal but a new reference must NOT be skipped by dedup.
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const propA = { series: baseOption.series } as EChartsOption;

      const { result, rerender } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: propA },
      });
      act(() => {
        result.current.ref(element);
      });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.appendData({ seriesIndex: 0, data: [42] });
      });
      expect(mockInstance.appendData).toHaveBeenCalledTimes(1);

      rerender({ option: { series: baseOption.series } });
      await waitFor(() => {
        expect(mockInstance.setOption).toHaveBeenCalledTimes(2);
      });
    });

    it("should route errors through onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const err = new Error("appendData boom");
      mockInstance.appendData.mockImplementation(() => {
        throw err;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });
      act(() => {
        result.current.appendData({ seriesIndex: 0, data: [] });
      });
      expect(onError).toHaveBeenCalledWith(err);
    });
  });

  describe("imperative API additions", () => {
    function setupReady() {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);
      return { element, mockInstance };
    }

    describe("getOption", () => {
      it("forwards return from instance.getOption()", () => {
        const { element, mockInstance } = setupReady();
        const fakeOption = { title: { text: "x" } };
        mockInstance.getOption.mockReturnValue(fakeOption);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        expect(result.current.getOption()).toBe(fakeOption);
        expect(mockInstance.getOption).toHaveBeenCalled();
      });

      it("returns undefined when instance is not initialized", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.getOption()).toBeUndefined();
      });

      it("routes errors through onError and returns undefined", () => {
        const { element, mockInstance } = setupReady();
        const err = new Error("getOption boom");
        mockInstance.getOption.mockImplementation(() => {
          throw err;
        });
        const onError = vi.fn();
        const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
        act(() => {
          result.current.ref(element);
        });

        expect(result.current.getOption()).toBeUndefined();
        expect(onError).toHaveBeenCalledWith(err);
      });

      it("rethrows when no onError is provided", () => {
        const { element, mockInstance } = setupReady();
        mockInstance.getOption.mockImplementation(() => {
          throw new Error("getOption boom");
        });
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        expect(() => result.current.getOption()).toThrow("getOption boom");
      });
    });

    describe("getWidth / getHeight", () => {
      it("forward returns from instance", () => {
        const { element, mockInstance } = setupReady();
        mockInstance.getWidth.mockReturnValue(640);
        mockInstance.getHeight.mockReturnValue(480);
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        expect(result.current.getWidth()).toBe(640);
        expect(result.current.getHeight()).toBe(480);
      });

      it("return undefined when instance is not initialized", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.getWidth()).toBeUndefined();
        expect(result.current.getHeight()).toBeUndefined();
      });
    });

    describe("getDom", () => {
      it("forwards instance.getDom()", () => {
        const { element } = setupReady();
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        expect(result.current.getDom()).toBe(element);
      });

      it("returns undefined when instance is not initialized", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.getDom()).toBeUndefined();
      });
    });

    describe("isDisposed", () => {
      it("forwards instance.isDisposed()", () => {
        const { element, mockInstance } = setupReady();
        mockInstance.isDisposed.mockReturnValue(false);
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        expect(result.current.isDisposed()).toBe(false);
      });

      it("returns true when instance is not initialized (semantically disposed)", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.isDisposed()).toBe(true);
      });

      it("falls back to true on error and routes through onError", () => {
        const { element, mockInstance } = setupReady();
        mockInstance.isDisposed.mockImplementation(() => {
          throw new Error("isDisposed boom");
        });
        const onError = vi.fn();
        const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
        act(() => {
          result.current.ref(element);
        });
        expect(result.current.isDisposed()).toBe(true);
        expect(onError).toHaveBeenCalled();
      });
    });

    describe("getDataURL / getConnectedDataURL / getSvgDataURL / renderToSVGString", () => {
      it("forward opts and return strings from instance", () => {
        const { element, mockInstance } = setupReady();
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(result.current.getDataURL({ type: "png", pixelRatio: 2 })).toBe(
          "data:image/png;base64,mock",
        );
        expect(mockInstance.getDataURL).toHaveBeenCalledWith({ type: "png", pixelRatio: 2 });

        expect(result.current.getConnectedDataURL()).toBe("data:image/png;base64,connected-mock");
        expect(mockInstance.getConnectedDataURL).toHaveBeenCalled();

        expect(result.current.getSvgDataURL()).toBe("data:image/svg+xml;base64,svg-mock");
        expect(result.current.renderToSVGString({ useViewBox: true })).toBe("<svg></svg>");
      });

      it("return undefined when instance is not initialized", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.getDataURL()).toBeUndefined();
        expect(result.current.getConnectedDataURL()).toBeUndefined();
        expect(result.current.getSvgDataURL()).toBeUndefined();
        expect(result.current.renderToSVGString()).toBeUndefined();
      });
    });

    describe("convertToPixel / convertFromPixel / containPixel", () => {
      it("forward finder + value to instance", () => {
        const { element, mockInstance } = setupReady();
        mockInstance.convertToPixel.mockReturnValue([100, 200]);
        mockInstance.convertFromPixel.mockReturnValue([1, 2]);
        mockInstance.containPixel.mockReturnValue(true);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        const finder = { seriesIndex: 0 };
        expect(result.current.convertToPixel(finder, [10, 20])).toEqual([100, 200]);
        expect(mockInstance.convertToPixel).toHaveBeenCalledWith(finder, [10, 20]);

        expect(result.current.convertFromPixel(finder, [100, 200])).toEqual([1, 2]);
        expect(result.current.containPixel(finder, [50, 60])).toBe(true);
      });

      it("return undefined / false when instance is not initialized", () => {
        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        expect(result.current.convertToPixel("series", 10)).toBeUndefined();
        expect(result.current.convertFromPixel("series", 10)).toBeUndefined();
        expect(result.current.containPixel("series", [10, 20])).toBe(false);
      });
    });
  });

  describe("cleanup", () => {
    it("should dispose instance on unmount", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      unmount();

      expect(mockInstance.dispose).toHaveBeenCalled();
    });

    it("should remove from group on unmount", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount, result } = renderHook(() =>
        useEcharts({ option: baseOption, group: "testGroup" }),
      );
      act(() => {
        result.current.ref(element);
      });

      await waitFor(() => {
        expect(getGroupInstances("testGroup")).toContain(mockInstance);
      });

      unmount();

      expect(getGroupInstances("testGroup")).not.toContain(mockInstance);
    });

    it("should cache instance correctly", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(getCachedInstance(element)).toBe(mockInstance);
    });
  });

  describe("event shorthand API", () => {
    it("should bind function shorthand events", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = {
        click: clickHandler,
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      expect(mockInstance.on).toHaveBeenCalledWith("click", clickHandler, undefined);
    });

    it("should unbind function shorthand events on unmount", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const onEvents = { click: clickHandler };

      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

      unmount();

      expect(mockInstance.off).toHaveBeenCalledWith("click", clickHandler);
    });

    it("should support mixed shorthand and full config", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const clickHandler = vi.fn();
      const mouseoverHandler = vi.fn();
      const onEvents = {
        click: clickHandler,
        mouseover: { handler: mouseoverHandler, query: "series" },
      };

      const { result } = renderHook(() => useEcharts({ option: baseOption, onEvents }));
      act(() => {
        result.current.ref(element);
      });

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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const option1: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [4, 5, 6] }] };

      const { rerender, result } = renderHook(({ option }) => useEcharts({ option, onError }), {
        initialProps: { option: option1 },
      });
      act(() => {
        result.current.ref(element);
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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const option1: EChartsOption = { series: [{ type: "line", data: [1, 2, 3] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [4, 5, 6] }] };

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { rerender, result } = renderHook(({ option }) => useEcharts({ option }), {
        initialProps: { option: option1 },
      });
      act(() => {
        result.current.ref(element);
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
      const mockInstance1 = createMockInstance(element);
      const mockInstance2 = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const stableOption: EChartsOption = {
        series: [{ type: "line", data: [1, 2, 3] }],
      };

      const { rerender, result } = renderHook(
        ({ theme }: { theme: BuiltinTheme }) => useEcharts({ option: stableOption, theme }),
        { initialProps: { theme: "light" as BuiltinTheme } },
      );
      act(() => {
        result.current.ref(element);
      });

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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      // ResizeObserver should have been created and observe called
      expect(resizeObserverInstances.length).toBeGreaterThan(0);
      expect(resizeObserverInstances[0]!.observe).toHaveBeenCalled();
    });

    it("should gracefully handle ResizeObserver constructor failure", () => {
      const originalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        constructor() {
          throw new Error("ResizeObserver not supported");
        }
      } as unknown as typeof ResizeObserver;

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      // Should not throw
      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(errorSpy).toHaveBeenCalledWith("ResizeObserver not available:", expect.any(Error));

      errorSpy.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
    });

    it("should route ResizeObserver constructor failure to onError when provided", () => {
      const originalResizeObserver = globalThis.ResizeObserver;
      const thrown = new Error("ResizeObserver not supported");
      globalThis.ResizeObserver = class {
        constructor() {
          throw thrown;
        }
      } as unknown as typeof ResizeObserver;

      const onError = vi.fn();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      expect(onError).toHaveBeenCalledWith(thrown);
      expect(errorSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
    });

    it("should disconnect resize observer on unmount", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      unmount();

      expect(resizeObserverInstances[0]!.disconnect).toHaveBeenCalled();
    });

    it("should move resize observer to a replacement ref element", async () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      const mockInstance1 = createMockInstance(element1);
      const mockInstance2 = createMockInstance(element2);
      (echarts.init as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockInstance1)
        .mockReturnValueOnce(mockInstance2);

      const { rerender, result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element1);
      });

      await waitFor(() => {
        expect(resizeObserverInstances[0]!.observe).toHaveBeenCalledWith(element1);
      });

      act(() => {
        result.current.ref(element2);
      });
      rerender();

      await waitFor(() => {
        expect(resizeObserverInstances[1]!.observe).toHaveBeenCalledWith(element2);
      });
      expect(resizeObserverInstances[0]!.disconnect).toHaveBeenCalled();
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
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
          cb(0);
          return 1;
        });

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

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
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        let storedCallback: FrameRequestCallback | undefined;
        let nextId = 1;
        globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
          storedCallback = cb;
          return nextId++;
        });
        globalThis.cancelAnimationFrame = vi.fn();

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

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
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        globalThis.requestAnimationFrame = vi.fn(() => 42);
        globalThis.cancelAnimationFrame = vi.fn();

        const { unmount, result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

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

      it("should route RAF resize errors through onError", () => {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        const resizeError = new Error("RAF resize failed");
        mockInstance.resize.mockImplementation(() => {
          throw resizeError;
        });
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
          cb(0);
          return 1;
        });

        const onError = vi.fn();
        const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
        act(() => {
          result.current.ref(element);
        });

        const observer = resizeObserverInstances[0] as unknown as MockResizeObserver;
        act(() => {
          observer.callback(
            [] as unknown as ResizeObserverEntry[],
            observer as unknown as ResizeObserver,
          );
        });

        expect(onError).toHaveBeenCalledWith(resizeError);
      });
    });

    it("should not create resize observer when autoResize is false", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption, autoResize: false }));
      act(() => {
        result.current.ref(element);
      });

      expect(resizeObserverInstances).toHaveLength(0);
    });

    describe("visibilitychange resume", () => {
      // Mock on the instance — happy-dom defines `hidden` as an own property on
      // `document`, which shadows any Document.prototype getter we'd install.
      const ownDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
      let hiddenValue = false;

      beforeEach(() => {
        hiddenValue = false;
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => hiddenValue,
        });
      });

      afterEach(() => {
        if (ownDescriptor) {
          Object.defineProperty(document, "hidden", ownDescriptor);
        } else {
          delete (document as unknown as { hidden?: boolean }).hidden;
        }
      });

      it("should resize when tab becomes visible again", () => {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        // Reset resize calls from initial mount (e.g. from ResizeObserver firing
        // on observe() in happy-dom).
        mockInstance.resize.mockClear();

        hiddenValue = true;
        document.dispatchEvent(new Event("visibilitychange"));
        expect(mockInstance.resize).not.toHaveBeenCalled();

        hiddenValue = false;
        document.dispatchEvent(new Event("visibilitychange"));
        expect(mockInstance.resize).toHaveBeenCalledTimes(1);
      });

      it("should remove visibilitychange listener on unmount", () => {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const { unmount, result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });
        unmount();

        // Cache is cleared on unmount, so even if the listener leaked the
        // resize call would no-op. Assert through the listener API: a fresh
        // event after unmount does not bring the disposed instance's resize
        // back to life.
        mockInstance.resize.mockClear();
        document.dispatchEvent(new Event("visibilitychange"));
        expect(mockInstance.resize).not.toHaveBeenCalled();
      });

      it("should attach a single document listener regardless of hook count", () => {
        const addSpy = vi.spyOn(document, "addEventListener");
        const removeSpy = vi.spyOn(document, "removeEventListener");

        const element1 = document.createElement("div");
        const element2 = document.createElement("div");
        const mockInstance1 = createMockInstance(element1);
        const mockInstance2 = createMockInstance(element2);
        (echarts.init as ReturnType<typeof vi.fn>)
          .mockReturnValueOnce(mockInstance1)
          .mockReturnValueOnce(mockInstance2);

        const hook1 = renderHook(() => useEcharts({ option: baseOption }));
        const hook2 = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          hook1.result.current.ref(element1);
        });
        act(() => {
          hook2.result.current.ref(element2);
        });

        const visibilityAdds = addSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
        expect(visibilityAdds).toHaveLength(1);

        // First unmount keeps the shared listener attached.
        hook1.unmount();
        let visibilityRemoves = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
        expect(visibilityRemoves).toHaveLength(0);

        // Last unmount detaches the single listener.
        hook2.unmount();
        visibilityRemoves = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
        expect(visibilityRemoves).toHaveLength(1);

        addSpy.mockRestore();
        removeSpy.mockRestore();
      });
    });
  });

  describe("initOpts", () => {
    it("should pass initOpts to echarts.init", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() =>
        useEcharts({
          option: baseOption,
          initOpts: { devicePixelRatio: 2, locale: "ZH" },
        }),
      );
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, null, {
        renderer: "canvas",
        devicePixelRatio: 2,
        locale: "ZH",
      });
    });

    it("should handle non-serializable initOpts without throwing", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const circular: Record<string, unknown> = { locale: "ZH" };
      circular.self = circular;

      const { result } = renderHook(() =>
        useEcharts({
          option: baseOption,
          initOpts: circular as never,
        }),
      );
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(
        element,
        null,
        expect.objectContaining({ renderer: "canvas", locale: "ZH" }),
      );
    });
  });

  describe("non-builtin string theme", () => {
    it("should pass non-builtin string theme through to echarts.init", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() =>
        useEcharts({ option: baseOption, theme: "custom-theme-string" }),
      );
      act(() => {
        result.current.ref(element);
      });

      // resolveThemeName should pass any string theme through
      expect(echarts.init).toHaveBeenCalledWith(element, "custom-theme-string", expect.any(Object));
    });

    it("should treat unexpected theme type (e.g. number) as null", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      // Force a non-string, non-object, non-null theme to exercise the defensive fallback
      const { result } = renderHook(() => useEcharts({ option: baseOption, theme: 42 as never }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalledWith(element, null, expect.any(Object));
    });
  });

  describe("circular reference theme", () => {
    it("should handle circular reference theme object without throwing", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const circularTheme: Record<string, unknown> = { color: ["#abc"] };
      circularTheme.self = circularTheme;

      const { result } = renderHook(() => useEcharts({ option: baseOption, theme: circularTheme }));
      act(() => {
        result.current.ref(element);
      });

      expect(echarts.init).toHaveBeenCalled();
    });

    it("should reuse cached key when same circular theme is used in a new hook instance", () => {
      const circularTheme: Record<string, unknown> = { color: ["#def"] };
      circularTheme.self = circularTheme;

      // First hook instance — registers the circular theme ID
      const el1 = document.createElement("div");
      const mock1 = createMockInstance(el1);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mock1);

      const hook1 = renderHook(() => useEcharts({ option: baseOption, theme: circularTheme }));
      act(() => {
        hook1.result.current.ref(el1);
      });
      hook1.unmount();

      // Second hook instance — should hit WeakMap cache for the same circular theme
      const el2 = document.createElement("div");
      const mock2 = createMockInstance(el2);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mock2);

      const hook2 = renderHook(() => useEcharts({ option: baseOption, theme: circularTheme }));
      act(() => {
        hook2.result.current.ref(el2);
      });

      expect(echarts.registerTheme).toHaveBeenCalledTimes(1);
      const firstThemeName = (echarts.init as ReturnType<typeof vi.fn>).mock.calls[0]![1];
      const secondThemeName = (echarts.init as ReturnType<typeof vi.fn>).mock.calls[1]![1];
      expect(firstThemeName).toBe(secondThemeName);
    });

    it("should assign distinct IDs to distinct circular theme objects", () => {
      const theme1: Record<string, unknown> = { color: ["#111"] };
      theme1.self = theme1;
      const theme2: Record<string, unknown> = { color: ["#222"] };
      theme2.self = theme2;

      const el1 = document.createElement("div");
      const mock1 = createMockInstance(el1);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mock1);

      const hook1 = renderHook(() => useEcharts({ option: baseOption, theme: theme1 }));
      act(() => {
        hook1.result.current.ref(el1);
      });

      const el2 = document.createElement("div");
      const mock2 = createMockInstance(el2);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValueOnce(mock2);

      const hook2 = renderHook(() => useEcharts({ option: baseOption, theme: theme2 }));
      act(() => {
        hook2.result.current.ref(el2);
      });

      expect(echarts.registerTheme).toHaveBeenCalledTimes(2);
      const firstThemeName = (echarts.init as ReturnType<typeof vi.fn>).mock.calls[0]![1];
      const secondThemeName = (echarts.init as ReturnType<typeof vi.fn>).mock.calls[1]![1];
      expect(firstThemeName).not.toBe(secondThemeName);
    });
  });

  describe("init error handling", () => {
    it("should call onError when echarts.init throws", () => {
      const element = document.createElement("div");
      const initError = new Error("init failed");
      (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw initError;
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      expect(onError).toHaveBeenCalledWith(initError);
    });

    it("should console.error when echarts.init throws without onError", () => {
      const element = document.createElement("div");
      const initError = new Error("init failed");
      (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw initError;
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(errorSpy).toHaveBeenCalledWith("ECharts init failed:", initError);
      errorSpy.mockRestore();
    });

    it("should hint about missing registration when init fails with 'not a constructor' in dev", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      resetDevWarnings();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      try {
        const element = document.createElement("div");
        (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new TypeError("ka[a] is not a constructor");
        });

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("registerEchartsFull()"));
      } finally {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
        resetDevWarnings();
      }
    });

    it("should not hint about registration for unrelated init errors in dev", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      resetDevWarnings();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      try {
        const element = document.createElement("div");
        (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("some unrelated boom");
        });

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining("registerEchartsFull()"));
      } finally {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
        resetDevWarnings();
      }
    });

    it("should hint about missing registration only once in dev", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      resetDevWarnings();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      try {
        (echarts.init as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new TypeError("Ctor is not a constructor");
        });

        const first = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          first.result.current.ref(document.createElement("div"));
        });
        const second = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          second.result.current.ref(document.createElement("div"));
        });

        const hintCalls = warnSpy.mock.calls.filter(
          ([msg]) => typeof msg === "string" && msg.includes("registerEchartsFull()"),
        );
        expect(hintCalls).toHaveLength(1);
      } finally {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
        resetDevWarnings();
      }
    });

    it("should call onError when initial setOption throws", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const setOptionError = new Error("initial setOption failed");
      // Only throw once (during the lifecycle effect's initial setOption);
      // subsequent calls from the OPTION-SYNC effect should succeed.
      mockInstance.setOption
        .mockImplementationOnce(() => {
          throw setOptionError;
        })
        .mockImplementation(() => {});
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(setOptionError);
    });

    // Regression: lifecycle setOption and Option-Sync setOption both fire on
    // mount. Before the try/finally fix, a throw in the lifecycle path left
    // `lastAppliedRef` null, so Option-Sync (running on the same render)
    // would re-invoke setOption with the SAME args, throw again, and report
    // the same failure twice via onError. The fix records the attempt
    // unconditionally so Option-Sync dedups against it.
    it("does not double-fire onError when setOption keeps throwing for the same option", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const setOptionError = new Error("malformed option");
      // Persistent throw (no mockImplementationOnce): both the lifecycle and
      // the Option-Sync path would attempt the same setOption call.
      mockInstance.setOption.mockImplementation(() => {
        throw setOptionError;
      });
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(setOptionError);
      // Only the lifecycle attempt fires setOption; Option-Sync's same-render
      // re-attempt is suppressed by the recorded lastAppliedRef.
      expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
    });

    it("should console.error when initial setOption throws without onError", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      const setOptionError = new Error("initial setOption failed");
      // Only throw once (during the lifecycle effect's initial setOption);
      // subsequent calls from the OPTION-SYNC effect should succeed.
      mockInstance.setOption
        .mockImplementationOnce(() => {
          throw setOptionError;
        })
        .mockImplementation(() => {});
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      expect(errorSpy).toHaveBeenCalledWith("ECharts setOption failed:", setOptionError);
      errorSpy.mockRestore();
    });
  });

  describe("imperative setOption error handling", () => {
    it("should call onError when imperative setOption throws", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError = vi.fn();
      const { result } = renderHook(() => useEcharts({ option: baseOption, onError }));
      act(() => {
        result.current.ref(element);
      });

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
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      mockInstance.setOption.mockImplementation(() => {
        throw new Error("imperative setOption failed");
      });

      expect(() => {
        result.current.setOption({ series: [] });
      }).toThrow("imperative setOption failed");
    });

    it("should do nothing when imperative setOption is called without instance", () => {
      const { result } = renderHook(() => useEcharts({ option: baseOption }));

      // Should not throw — early return because no instance
      act(() => {
        result.current.setOption({ series: [] });
      });
    });
  });

  describe("cache hit on init", () => {
    it("should reuse existing cached instance instead of calling echarts.init", () => {
      const element = document.createElement("div");
      const existingInstance = createMockInstance(element);

      // Pre-populate the cache as if another hook already owns this element
      setCachedInstance(element, existingInstance as never);

      const { result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      // echarts.init should NOT be called since the cache already had an instance
      expect(echarts.init).not.toHaveBeenCalled();
      // The existing instance should still be used (setOption called on it)
      expect(existingInstance.setOption).toHaveBeenCalledWith(baseOption, undefined);
    });

    it("should warn in development when reusing cached instance from another consumer", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        const existingInstance = createMockInstance(element);

        setCachedInstance(element, existingInstance as never);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("multiple hooks share the same DOM element"),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("should not warn in production when reusing cached instance from another consumer", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        const existingInstance = createMockInstance(element);

        setCachedInstance(element, existingInstance as never);

        const { result } = renderHook(() => useEcharts({ option: baseOption }));
        act(() => {
          result.current.ref(element);
        });

        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("multiple hooks share the same DOM element"),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
    });
  });

  describe("cleanup edge cases", () => {
    it("should handle cleanup when instance is already gone", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const { unmount, result } = renderHook(() => useEcharts({ option: baseOption }));
      act(() => {
        result.current.ref(element);
      });

      // Clear the cache before unmounting so cleanup finds no instance
      clearInstanceCache();

      // Should not throw
      unmount();
    });
  });

  // After migrating effect-context error routing to `useEffectEvent` (and
  // keeping `latestRef.current.onError` for the imperative API), these tests
  // ensure that swapping `onError` between renders routes the next failure to
  // the latest callback — not the mount-time one.
  describe("onError freshness", () => {
    it("routes effect-context errors to the latest onError after rerender", async () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError1 = vi.fn();
      const onError2 = vi.fn();
      const option1: EChartsOption = { series: [{ type: "line", data: [1] }] };
      const option2: EChartsOption = { series: [{ type: "bar", data: [2] }] };

      const { rerender, result } = renderHook(
        ({ onError, option }: { onError: (e: unknown) => void; option: EChartsOption }) =>
          useEcharts({ option, onError }),
        { initialProps: { onError: onError1, option: option1 } },
      );
      act(() => {
        result.current.ref(element);
      });

      // Swap onError, then trigger an error via the Option-Sync effect.
      const error = new Error("setOption failed after swap");
      mockInstance.setOption.mockImplementation(() => {
        throw error;
      });

      rerender({ onError: onError2, option: option2 });

      await waitFor(() => {
        expect(onError2).toHaveBeenCalledWith(error);
      });
      expect(onError1).not.toHaveBeenCalled();
    });

    it("routes cleanup-time errors to the latest onError after rerender", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError1 = vi.fn();
      const onError2 = vi.fn();

      const disposeError = new Error("dispose after onError swap");
      mockInstance.dispose.mockImplementation(() => {
        throw disposeError;
      });

      const { rerender, unmount, result } = renderHook(
        ({ onError }: { onError: (e: unknown) => void }) =>
          useEcharts({ option: baseOption, onError }),
        { initialProps: { onError: onError1 } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ onError: onError2 });

      expect(() => unmount()).not.toThrow();
      expect(onError2).toHaveBeenCalledWith(disposeError);
      expect(onError1).not.toHaveBeenCalled();
    });

    it("routes imperative-API errors to the latest onError after rerender", () => {
      const element = document.createElement("div");
      const mockInstance = createMockInstance(element);
      (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

      const onError1 = vi.fn();
      const onError2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onError }: { onError: (e: unknown) => void }) =>
          useEcharts({ option: baseOption, onError }),
        { initialProps: { onError: onError1 } },
      );
      act(() => {
        result.current.ref(element);
      });

      rerender({ onError: onError2 });

      const error = new Error("imperative setOption after swap");
      mockInstance.setOption.mockImplementation(() => {
        throw error;
      });

      act(() => {
        result.current.setOption({ series: [] });
      });

      expect(onError2).toHaveBeenCalledWith(error);
      expect(onError1).not.toHaveBeenCalled();
    });

    it("routes resize errors to the latest onError after rerender", () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");
      let hiddenValue = false;
      Object.defineProperty(Document.prototype, "hidden", {
        configurable: true,
        get: () => hiddenValue,
      });

      try {
        const element = document.createElement("div");
        const mockInstance = createMockInstance(element);
        (echarts.init as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

        const onError1 = vi.fn();
        const onError2 = vi.fn();

        const { rerender, result } = renderHook(
          ({ onError }: { onError: (e: unknown) => void }) =>
            useEcharts({ option: baseOption, onError }),
          { initialProps: { onError: onError1 } },
        );
        act(() => {
          result.current.ref(element);
        });

        rerender({ onError: onError2 });

        const resizeError = new Error("resize after onError swap");
        mockInstance.resize.mockImplementation(() => {
          throw resizeError;
        });

        // visibilitychange resume calls safeResize synchronously (no RAF).
        hiddenValue = true;
        document.dispatchEvent(new Event("visibilitychange"));
        hiddenValue = false;
        document.dispatchEvent(new Event("visibilitychange"));

        expect(onError2).toHaveBeenCalledWith(resizeError);
        expect(onError1).not.toHaveBeenCalled();
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(Document.prototype, "hidden", originalDescriptor);
        } else {
          delete (Document.prototype as unknown as { hidden?: boolean }).hidden;
        }
      }
    });
  });
});
