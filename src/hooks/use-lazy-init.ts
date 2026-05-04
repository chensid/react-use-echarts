import { useEffect, useState, type RefObject } from "react";
import { useRefElement } from "./internal/use-ref-element";
import { computeStableKey } from "../utils/stable-key";

/**
 * Hook for lazy initialization using IntersectionObserver
 * 使用 IntersectionObserver 的懒加载 Hook
 * @param elementRef Element reference to observe
 * @param options IntersectionObserver options or false to disable lazy init
 * @returns Whether the element is in viewport (or true if lazy init is disabled)
 */
export function useLazyInit(
  elementRef: RefObject<Element | null>,
  options: boolean | IntersectionObserverInit = false,
): boolean {
  const element = useRefElement(elementRef);
  return useLazyInitForElement(element, options);
}

export function useLazyInitForElement(
  element: Element | null,
  options: boolean | IntersectionObserverInit = false,
): boolean {
  const isLazyMode = options !== false;
  const [isInView, setIsInView] = useState(!isLazyMode);

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
    if (!isLazyMode || isInView || !element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isInView excluded (observer self-disconnects); thresholdDep stabilizes inline number[] in place of optThreshold
  }, [element, isLazyMode, optRoot, optRootMargin, thresholdDep]);

  // Derive visibility — when lazy mode is toggled off at runtime,
  // the hook should report visible without waiting for an effect tick.
  return !isLazyMode || isInView;
}
