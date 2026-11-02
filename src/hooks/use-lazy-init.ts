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
 * Eager mode latches too once an element is attached: switching lazy mode on
 * afterwards keeps `isInView` true instead of re-deferring what already
 * initialized (like `<img loading>` changing to "lazy" after load). Lazy mode
 * enabled before any element is attached still defers. Remount the component
 * for fresh per-element tracking.
 * 锁存语义：一旦相交过即终身锁存——更换 DOM 节点或重新开启 lazy 模式都不会重新观察。
 * 立即模式下挂载元素后同样锁存：之后再开启 lazy 不会把已初始化的内容重新推迟。
 *
 * A malformed `IntersectionObserverInit` (out-of-range `threshold`, unit-less
 * `rootMargin`, non-Element `root`) makes the observer constructor throw. The
 * hook never lets that escape: it logs via `console.error` and degrades to
 * eager init, so `isInView` becomes `true` and the chart still renders.
 * 传入非法的 IntersectionObserverInit 时不会抛出：改为 console.error 并降级为立即
 * 初始化（isInView 变为 true），保证图表仍能渲染。
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
  // Public type forbids null, but JS callers can still pass it: treat it like
  // false (lazy disabled), matching the `= false` default. The `!== null` check
  // on isObject below keeps the option reads from dereferencing null.
  const isLazyMode = options != null && options !== false;
  // `latched`: whatever this hook gates has initialized — the observer saw an
  // intersection, or an element attached while lazy mode was off. It never
  // resets (see the latching note on useLazyInit): re-observing would re-defer,
  // i.e. tear down, an initialized chart. react-intersection-observer likewise
  // keeps `inView` when `skip` toggles.
  //
  // Not seeded via useState(!isLazyMode): that would also latch an eager hook
  // with no element yet, so lazy mode enabled before the container attaches
  // would never observe.
  const [latched, setLatched] = useState(false);
  // Eager mode with an attached element has initialized: latch during render
  // (React's "store information from previous renders" pattern) so a later
  // switch to lazy mode can't flip the result back to false for one render.
  if (!isLazyMode && element !== null && !latched) {
    setLatched(true);
  }

  const isObject = typeof options === "object" && options !== null;
  const optRoot = isObject ? options.root : null;
  const optRootMargin = isObject ? options.rootMargin : undefined;
  const optThreshold = isObject ? options.threshold : undefined;

  // Stable dep for inline number[] threshold (e.g. lazyInit={{ threshold: [0, 0.5, 1] }})
  // so a new array literal each render doesn't recreate the observer.
  const thresholdDep = computeStableKey(optThreshold);

  useEffect(() => {
    if (!isLazyMode || latched || !element) return;

    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          // Records queue up until the callback task runs, so one batch can hold
          // a stale `isIntersecting: false` ahead of the current `true`. Reading
          // only entries[0] would miss it, and an element that then stays in
          // view never fires again. Any intersecting record latches.
          if (entries.some((entry) => entry.isIntersecting)) {
            setLatched(true);
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
      // Type-valid but malformed options make the constructor throw: an
      // out-of-range/NaN threshold (RangeError), unit-less rootMargin
      // (SyntaxError) or non-Element root (TypeError). Never let that escape the
      // effect and tear down the React tree: degrade to eager init so the chart
      // still renders, and log (onError isn't plumbed into this hook).
      console.error(
        "useLazyInit: invalid IntersectionObserver options; falling back to eager init.",
        error,
      );
      setLatched(true);
      return;
    }

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latched excluded (observer self-disconnects); thresholdDep stabilizes inline number[] in place of optThreshold
  }, [element, isLazyMode, optRoot, optRootMargin, thresholdDep]);

  // Visible when lazy mode is off (instant init) or the hook has latched.
  return !isLazyMode || latched;
}
