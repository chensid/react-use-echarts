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
 * Latching semantics: lazy means "defer until first visible", not "track
 * visibility". Once intersected the hook latches for its lifetime — neither
 * DOM-node replacement nor toggling lazy mode off/on re-arms observation.
 * Remount the component for fresh per-element tracking.
 * 锁存语义：一旦相交过即终身锁存——更换 DOM 节点或重新开启 lazy 模式都不会重新观察。
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
  // Public type forbids null, but JS callers can still pass it; treat null like
  // false (lazy disabled / instant visible), matching the `= false` default and
  // resolveThemeName's identical typeof-null guard (use-chart-core.ts). Without
  // the `!== null` check on isObject below, `typeof null === "object"` would make
  // the option reads deref null and throw during render on every pass.
  const isLazyMode = options != null && options !== false;
  // State holds ONLY the observer's "has fired with isIntersecting" verdict.
  // Initial visibility (when lazy mode is disabled) is derived at return,
  // NOT seeded via useState(!isLazyMode) — that initializer only runs on
  // first mount, so flipping `lazyInit` from false→true at runtime would
  // otherwise leave the value permanently `true` and skip observation.
  //
  // hasIntersected deliberately NEVER resets (the effect below early-returns
  // on it): re-observing after a node swap or lazyInit false→true would
  // re-defer — i.e. tear down — an already-initialized chart.
  const [hasIntersected, setHasIntersected] = useState(false);

  // Extract config values for stable dependency comparison
  // 提取配置值用于稳定的依赖比较
  const isObject = typeof options === "object" && options !== null;
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

    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver(
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
    } catch (error) {
      // A malformed IntersectionObserverInit makes the constructor throw
      // synchronously — out-of-range/NaN threshold (RangeError), unit-less
      // rootMargin (SyntaxError), or non-Element root (TypeError). These are all
      // type-valid per `IntersectionObserverInit`, so even TS callers can hit it.
      // Mirror useResizeObserver's construction try/catch: never let it escape
      // the effect and tear down the React tree. Degrade to eager init (treat as
      // visible) so the chart still renders — matching this file's null-guard
      // "don't throw, fall back to visible" philosophy. onError is intentionally
      // not plumbed into this hook, so we log rather than route.
      console.error(
        "useLazyInit: invalid IntersectionObserver options; falling back to eager init.",
        error,
      );
      setHasIntersected(true);
      return;
    }

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
