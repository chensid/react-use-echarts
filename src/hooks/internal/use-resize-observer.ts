import { useEffect, useLayoutEffect, useRef } from "react";
import { getCachedInstance } from "../../utils/instance-cache";
import { subscribeVisibilityResume } from "../../utils/visibility-coordinator";
import { reportEffectError } from "../../utils/error";

/**
 * Internal hook: ResizeObserver-based auto-resize with RAF throttle.
 * 内部 hook：基于 ResizeObserver 的自动 resize，使用 RAF 节流。
 */
export function useResizeObserver(
  element: HTMLElement | null,
  autoResize: boolean,
  onError?: (error: unknown) => void,
): void {
  // Latest `onError`, read when a resize fails, so changing it never recreates
  // the observer. A ref rather than `useEffectEvent`: React 19.2.x leaves that
  // callback stale inside memo() / forwardRef components (see utils/error.ts).
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
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
        reportEffectError(error, onErrorRef.current, "ECharts resize failed:");
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
      reportEffectError(error, onErrorRef.current, "ResizeObserver not available:");
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
