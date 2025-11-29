import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLazyInit } from "../../hooks/use-lazy-init";

describe("useLazyInit", () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let intersectionCallback: (entries: { isIntersecting: boolean }[]) => void;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    mockUnobserve = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback as (entries: { isIntersecting: boolean }[]) => void;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = mockUnobserve;
    }
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true immediately when lazy mode is disabled (false)", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useLazyInit(ref, false));

    expect(result.current).toBe(true);
    // Should not observe when lazy mode is disabled
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should return false initially when lazy mode is enabled", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useLazyInit(ref, true));

    // Initially false before intersection
    expect(result.current).toBe(false);
    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("should return true when element intersects", async () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useLazyInit(ref, true));

    expect(result.current).toBe(false);

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Should disconnect after becoming visible
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should not change state when element does not intersect", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useLazyInit(ref, true));

    // Simulate non-intersection
    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });

    expect(result.current).toBe(false);
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it("should use default IntersectionObserver options", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    renderHook(() => useLazyInit(ref, true));

    // Verify observe was called
    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("should merge custom IntersectionObserver options", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const customOptions = {
      rootMargin: "100px",
      threshold: 0.5,
    };

    renderHook(() => useLazyInit(ref, customOptions));

    // Verify observe was called
    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("should handle null ref", () => {
    const ref = { current: null };

    const { result } = renderHook(() => useLazyInit(ref, true));

    // Should not throw
    expect(result.current).toBe(false);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should cleanup on unmount", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { unmount } = renderHook(() => useLazyInit(ref, true));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should handle empty object options as lazy mode enabled", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useLazyInit(ref, {}));

    expect(result.current).toBe(false);
    expect(mockObserve).toHaveBeenCalled();
  });

  it("should not re-observe once visible", async () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result, rerender } = renderHook(() => useLazyInit(ref, true));

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Clear mocks and rerender
    mockObserve.mockClear();
    rerender();

    // Should not observe again since already visible
    expect(mockObserve).not.toHaveBeenCalled();
  });
});

