import { useEffect } from "react";
import { getCachedInstance } from "../../utils/instance-cache";

/**
 * Internal hook: ResizeObserver-based auto-resize with RAF throttle.
 * 内部 hook：基于 ResizeObserver 的自动 resize，使用 RAF 节流。
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
  autoResize: boolean,
): void {
  useEffect(() => {
    if (!autoResize) return;

    const element = ref.current;
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
      console.warn("ResizeObserver not available:", error);
    }

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };
  }, [ref, autoResize]);
}
