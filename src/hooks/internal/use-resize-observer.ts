import { useEffect, useEffectEvent } from "react";
import { getCachedInstance } from "../../utils/instance-cache";
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
  // `useEffectEvent` reads the latest `onError` at call time without re-triggering
  // the observer effect, replacing the React 18-era `onErrorRef` ping-pong.
  const handleResizeError = useEffectEvent((error: unknown, message: string) => {
    if (onError) onError(error);
    else console.error(message, error);
  });

  useEffect(() => {
    if (!autoResize) return;

    if (!element) return;

    let resizeObserver: ResizeObserver | undefined;
    let rafId: number | undefined;

    const cancelPendingResize = (): void => {
      if (rafId === undefined) return;
      cancelAnimationFrame(rafId);
      rafId = undefined;
    };

    const safeResize = (): void => {
      try {
        getCachedInstance(element)?.resize();
      } catch (error) {
        handleResizeError(error, "ECharts resize failed:");
      }
    };

    try {
      resizeObserver = new ResizeObserver(() => {
        cancelPendingResize();
        rafId = requestAnimationFrame(() => {
          rafId = undefined;
          safeResize();
        });
      });
      resizeObserver.observe(element);
    } catch (error) {
      handleResizeError(error, "ResizeObserver not available:");
    }

    // Browsers throttle requestAnimationFrame in hidden tabs, so a resize that
    // fires while the tab is in background may never reach the chart. Resync
    // when the tab becomes visible again. Subscription goes through a module
    // coordinator so a single document listener serves all chart instances.
    const unsubscribeVisibility = subscribeVisibilityResume(safeResize);

    return () => {
      cancelPendingResize();
      resizeObserver?.disconnect();
      unsubscribeVisibility();
    };
  }, [element, autoResize]);
}
