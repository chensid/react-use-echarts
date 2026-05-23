import { useCallback, useEffect, useState } from "react";
import { computeStableKey } from "../utils/stable-key";
import type { UseLazyInitReturn } from "../types";

/**
 * Hook for lazy initialization using IntersectionObserver
 * 使用 IntersectionObserver 的懒加载 Hook
 *
 * Returns a callback `ref` to attach to the target element and a
 * reactive `isInView` boolean. Pass `false` (default) to disable
 * lazy mode — `isInView` is then always `true`.
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useLazyInit({ rootMargin: "100px" });
 * return <div ref={ref}>{isInView ? <Chart /> : null}</div>;
 * ```
 */
export function useLazyInit(
  options: boolean | IntersectionObserverInit = false,
): UseLazyInitReturn {
  const [element, setElement] = useState<Element | null>(null);
  const ref = useCallback((node: Element | null) => {
    setElement(node);
    return () => setElement(null);
  }, []);
  const isInView = useLazyInitForElement(element, options);
  return { ref, isInView };
}

export function useLazyInitForElement(
  element: Element | null,
  options: boolean | IntersectionObserverInit = false,
): boolean {
  const isLazyMode = options !== false;
  // State holds ONLY the observer's "has fired with isIntersecting" verdict.
  // Initial visibility (when lazy mode is disabled) is derived at return,
  // NOT seeded via useState(!isLazyMode) — that initializer only runs on
  // first mount, so flipping `lazyInit` from false→true at runtime would
  // otherwise leave the value permanently `true` and skip observation.
  const [hasIntersected, setHasIntersected] = useState(false);

  // Extract config values for stable dependency comparison
  // 提取配置值用于稳定的依赖比较
  const isObject = typeof options === "object";
  const optRoot = isObject ? options.root : null;
  const optRootMargin = isObject ? options.rootMargin : undefined;
  const optThreshold = isObject ? options.threshold : undefined;

  // Stable dep for inline number[] threshold (e.g. lazyInit={{ threshold: [0, 0.5, 1] }})
  // so a new array literal each render doesn't recreate the observer.
  const thresholdDep = computeStableKey(optThreshold);

  useEffect(() => {
    // Skip if lazy mode is disabled or already in view
    // 如果禁用了懒加载模式或已经可见，则跳过
    if (!isLazyMode || hasIntersected || !element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setHasIntersected(true);
          // Once visible, stop observing
          // 一旦可见，就停止观察
          observer.disconnect();
        }
      },
      {
        root: optRoot ?? null,
        rootMargin: optRootMargin ?? "50px",
        threshold: optThreshold ?? 0.1,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasIntersected excluded (observer self-disconnects); thresholdDep stabilizes inline number[] in place of optThreshold
  }, [element, isLazyMode, optRoot, optRootMargin, thresholdDep]);

  // Derive visibility: visible when lazy mode is off (instant init) OR the
  // observer has fired at least once. Toggling lazy mode at runtime is
  // therefore correctly handled in both directions.
  return !isLazyMode || hasIntersected;
}
