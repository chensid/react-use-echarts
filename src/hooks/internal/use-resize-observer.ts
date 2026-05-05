import { useEffect, useLayoutEffect, useRef } from "react";
import { getCachedInstance } from "../../utils/instance-cache";
import { routeEffectError } from "../../utils/error";
import { subscribeVisibilityResume } from "../../utils/visibility-coordinator";

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

    const safeResize = (): void => {
      try {
        getCachedInstance(element)?.resize();
      } catch (error) {
        routeEffectError(error, "ECharts resize failed:", onErrorRef.current);
      }
    };

    try {
      resizeObserver = new ResizeObserver(() => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          rafId = undefined;
          safeResize();
        });
      });
      resizeObserver.observe(element);
    } catch (error) {
      routeEffectError(error, "ResizeObserver not available:", onErrorRef.current);
    }

    // Browsers throttle requestAnimationFrame in hidden tabs, so a resize that
    // fires while the tab is in background may never reach the chart. Resync
    // when the tab becomes visible again. Subscription goes through a module
    // coordinator so a single document listener serves all chart instances.
    const unsubscribeVisibility = subscribeVisibilityResume(safeResize);

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      unsubscribeVisibility();
    };
  }, [element, autoResize]);
}
