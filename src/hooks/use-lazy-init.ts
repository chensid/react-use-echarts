import { useEffect, useState } from "react";

/**
 * Hook for lazy initialization using IntersectionObserver
 * 使用 IntersectionObserver 的懒加载 Hook
 * @param elementRef Element reference to observe
 * @param options IntersectionObserver options or false to disable lazy init
 * @returns Whether the element is in viewport (or true if lazy init is disabled)
 */
export function useLazyInit(
  elementRef: React.RefObject<Element | null>,
  options: boolean | IntersectionObserverInit = {}
): boolean {
  // If lazyInit is false, initialize as already in view
  // 如果 lazyInit 为 false，初始状态就是可见
  const isLazyMode = options !== false;
  const [isInView, setIsInView] = useState(!isLazyMode);

  useEffect(() => {
    // Skip if lazy mode is disabled or already in view
    // 如果禁用了懒加载模式或已经可见，则跳过
    if (!isLazyMode || isInView) return;

    const element = elementRef.current;
    if (!element) return;

    // Default IntersectionObserver options
    // 默认的 IntersectionObserver 配置
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...(typeof options === 'object' ? options : {}),
    };

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
  }, [elementRef, options, isLazyMode, isInView]);

  return isInView;
}
