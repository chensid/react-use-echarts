import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { getCachedInstance } from "../../utils/instance-cache";

/**
 * Internal hook: ResizeObserver-based auto-resize with RAF throttle.
 * 内部 hook：基于 ResizeObserver 的自动 resize，使用 RAF 节流。
 */
export function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
  autoResize: boolean,
  onError?: (error: unknown) => void,
): void {
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
  });

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
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        console.warn("ResizeObserver not available:", error);
      }
    }

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };
  }, [ref, autoResize]);
}
