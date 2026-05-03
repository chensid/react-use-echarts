import { useEffect, useLayoutEffect, useRef } from "react";
import { getCachedInstance } from "../../utils/instance-cache";

/**
 * Internal hook: ResizeObserver-based auto-resize with RAF throttle.
 * 内部 hook：基于 ResizeObserver 的自动 resize，使用 RAF 节流。
 */
export function useResizeObserver(
  element: HTMLElement | null,
  autoResize: boolean,
  onError?: (error: unknown) => void,
): void {
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!autoResize) return;

    if (!element) return;

    let resizeObserver: ResizeObserver | undefined;
    let rafId: number | undefined;

    try {
      resizeObserver = new ResizeObserver(() => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          rafId = undefined;
          getCachedInstance(element)?.resize();
        });
      });
      resizeObserver.observe(element);
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        console.error("ResizeObserver not available:", error);
      }
    }

    // Browsers throttle requestAnimationFrame in hidden tabs, so a resize that
    // fires while the tab is in background may never reach the chart. Resync
    // when the tab becomes visible again.
    const handleVisibilityChange = (): void => {
      if (document.hidden) return;
      getCachedInstance(element)?.resize();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [element, autoResize]);
}
