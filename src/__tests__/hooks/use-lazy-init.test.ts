import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLazyInit } from "../../hooks/use-lazy-init";

describe("useLazyInit", () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let intersectionCallback: (entries: { isIntersecting: boolean }[]) => void;
  let lastConstructorOptions: IntersectionObserverInit | undefined;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    mockUnobserve = vi.fn();
    lastConstructorOptions = undefined;

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        intersectionCallback = callback as (entries: { isIntersecting: boolean }[]) => void;
        lastConstructorOptions = options;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = mockUnobserve;
    }
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true immediately when lazy mode is disabled (false)", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(false));
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isInView).toBe(true);
    // Should not observe when lazy mode is disabled
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should default to lazy mode disabled when options argument is omitted", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit());
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isInView).toBe(true);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should return false initially when lazy mode is enabled", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    // Initially false before intersection
    expect(result.current.isInView).toBe(false);
    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("should return true when element intersects", async () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isInView).toBe(false);

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.isInView).toBe(true);
    });

    // Should disconnect after becoming visible
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should not change state when element does not intersect", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    // Simulate non-intersection
    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });

    expect(result.current.isInView).toBe(false);
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it("should use default IntersectionObserver options", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    expect(mockObserve).toHaveBeenCalledWith(element);
    expect(lastConstructorOptions).toEqual({
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    });
  });

  it("should merge custom IntersectionObserver options", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit({ rootMargin: "100px", threshold: 0.5 }));
    act(() => {
      result.current.ref(element);
    });

    expect(mockObserve).toHaveBeenCalledWith(element);
    expect(lastConstructorOptions).toEqual({
      root: null,
      rootMargin: "100px",
      threshold: 0.5,
    });
  });

  it("should not recreate observer when threshold is an inline array across rerenders", () => {
    const element = document.createElement("div");

    let constructorCount = 0;
    class CountingObserver {
      constructor(_cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        constructorCount += 1;
        lastConstructorOptions = options;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = mockUnobserve;
    }
    globalThis.IntersectionObserver = CountingObserver as unknown as typeof IntersectionObserver;

    const { result, rerender } = renderHook(
      // Inline array literal — different reference every render
      () => useLazyInit({ threshold: [0, 0.5, 1] }),
    );
    act(() => {
      result.current.ref(element);
    });

    expect(constructorCount).toBe(1);
    expect(lastConstructorOptions?.threshold).toEqual([0, 0.5, 1]);

    rerender();
    rerender();

    expect(constructorCount).toBe(1);
  });

  it("should handle null ref", () => {
    const { result } = renderHook(() => useLazyInit(true));

    // Should not throw — without attaching the ref, no element is observed.
    expect(result.current.isInView).toBe(false);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should observe a replacement ref element before it is visible", async () => {
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");

    const { result } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element1);
    });

    expect(mockObserve).toHaveBeenCalledWith(element1);

    act(() => {
      result.current.ref(element2);
    });

    await waitFor(() => {
      expect(mockObserve).toHaveBeenCalledWith(element2);
    });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should cleanup on unmount", () => {
    const element = document.createElement("div");

    const { result, unmount } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should handle empty object options as lazy mode enabled", () => {
    const element = document.createElement("div");

    const { result } = renderHook(() => useLazyInit({}));
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isInView).toBe(false);
    expect(mockObserve).toHaveBeenCalled();
  });

  it("should not re-observe once visible", async () => {
    const element = document.createElement("div");

    const { result, rerender } = renderHook(() => useLazyInit(true));
    act(() => {
      result.current.ref(element);
    });

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.isInView).toBe(true);
    });

    // Clear mocks and rerender
    mockObserve.mockClear();
    rerender();

    // Should not observe again since already visible
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should become visible immediately when lazy mode is disabled after mount", async () => {
    const element = document.createElement("div");

    const { result, rerender } = renderHook(
      ({ lazyInit }: { lazyInit: boolean }) => useLazyInit(lazyInit),
      { initialProps: { lazyInit: true } },
    );
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isInView).toBe(false);

    rerender({ lazyInit: false });

    await waitFor(() => {
      expect(result.current.isInView).toBe(true);
    });
  });
});
