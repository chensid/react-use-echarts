import { useEffect, useState, useMemo } from "react";

/**
 * Hook for lazy initialization using IntersectionObserver
 * 使用 IntersectionObserver 的懒加载 Hook
 * @param elementRef Element reference to observe
 * @param options IntersectionObserver options or false to disable lazy init
 * @returns Whether the element is in viewport (or true if lazy init is disabled)
 */
export function useLazyInit(
  elementRef: React.RefObject<Element | null>,
  options: boolean | IntersectionObserverInit = false
): boolean {
  // If lazyInit is false, initialize as already in view
  // 如果 lazyInit 为 false，初始状态就是可见
  const isLazyMode = options !== false;
  const [isInView, setIsInView] = useState(!isLazyMode);

  // Extract config values for stable dependency comparison
  // 提取配置值用于稳定的依赖比较
  const isObject = typeof options === 'object';
  const optRoot = isObject ? options.root : null;
  const optRootMargin = isObject ? options.rootMargin : undefined;
  const optThreshold = isObject ? options.threshold : undefined;
  // Serialize threshold for stable comparison (can be number or array)
  // 序列化 threshold 用于稳定比较（可以是数字或数组）
  const thresholdKey = optThreshold !== undefined ? JSON.stringify(optThreshold) : undefined;

  // Create stable observer options to avoid unnecessary recreation
  // when inline objects are passed (e.g. lazyInit={{ threshold: 0.5 }})
  // 创建稳定的 observer 配置，避免传入内联对象时不必要的 observer 重建
  // Note: thresholdKey is used instead of optThreshold for stable array comparison
  // 注意：使用 thresholdKey 而非 optThreshold，确保数组类型的 threshold 比较稳定
  const observerOptions = useMemo((): IntersectionObserverInit => ({
    root: optRoot ?? null,
    rootMargin: optRootMargin ?? '50px',
    threshold: optThreshold ?? 0.1,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [optRoot, optRootMargin, thresholdKey]);

  useEffect(() => {
    // Skip if lazy mode is disabled or already in view
    // 如果禁用了懒加载模式或已经可见，则跳过
    if (!isLazyMode || isInView) return;

    const element = elementRef.current;
    if (!element) return;

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
      observerOptions
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, isLazyMode, isInView, observerOptions]);

  return isInView;
}
