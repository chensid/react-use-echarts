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
  // the observer (a ref, not `useEffectEvent`: see utils/error.ts).
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!autoResize || !element) return;

    let resizeObserver: ResizeObserver | undefined;
    let rafId: number | undefined;

    const cancelPendingResize = (): void => {
      if (rafId === undefined) return;
      cancelAnimationFrame(rafId);
      rafId = undefined;
    };

    // An immediate resize supersedes any still-pending frame.
    const safeResize = (): void => {
      cancelPendingResize();
      try {
        getCachedInstance(element)?.resize();
      } catch (error) {
        reportEffectError(error, onErrorRef.current, "ECharts resize failed:");
      }
    };

    try {
      resizeObserver = new ResizeObserver(() => {
        cancelPendingResize();
        rafId = requestAnimationFrame(safeResize);
      });
      resizeObserver.observe(element);
    } catch (error) {
      reportEffectError(error, onErrorRef.current, "ResizeObserver not available:");
    }

    // Browsers throttle requestAnimationFrame in hidden tabs, so a resize that
    // fired in the background may never reach the chart: resync when the tab is
    // visible again. One shared document listener serves all charts (see
    // visibility-coordinator).
    const unsubscribeVisibility = subscribeVisibilityResume(safeResize);

    // Unsubscribe first: it can't throw, so a failing disconnect (polyfills)
    // can't strand the shared document listener.
    return () => {
      cancelPendingResize();
      unsubscribeVisibility();
      resizeObserver?.disconnect();
    };
  }, [element, autoResize]);
}
