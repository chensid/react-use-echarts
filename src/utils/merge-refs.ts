import type { Ref, RefCallback } from "react";

/**
 * Merge multiple React refs (RefObject or RefCallback) into one
 * callback ref. Each input receives the resolved node on mount and
 * is cleared on unmount.
 * 将多个 React ref（RefObject 或 RefCallback）合并为一个 callback ref。
 *
 * Returns a React 19 callback ref whose cleanup chains to every input:
 *   - For a RefObject: sets `.current` on mount, clears to `null` on cleanup.
 *   - For a callback ref returning a cleanup (React 19): chains that cleanup.
 *   - For a legacy callback ref: invokes with `null` on cleanup.
 *
 * 返回的 callback ref 在 cleanup 时会顺序处理每个输入：
 * RefObject 写 null；React 19 cleanup-style 回调串联其 cleanup；
 * 旧式回调用 null 调用一次。
 *
 * `null` / `undefined` entries are skipped, so consumers can pass
 * optional refs without guards.
 * 允许传入 null / undefined，便于条件性合并。
 *
 * @example
 * ```tsx
 * const { ref: chartRef } = useEcharts(options);
 * const containerRef = useRef<HTMLDivElement>(null);
 * return <div ref={mergeRefs(chartRef, containerRef)} />;
 * ```
 */
export function mergeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined | null>): RefCallback<T> {
  return (node) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        // Isolate each ref invocation: a misbehaving 3rd-party logger ref must
        // not prevent the chart's own ref from receiving the node, otherwise
        // the chart silently never initializes.
        let result: unknown;
        try {
          result = ref(node);
        } catch (error) {
          console.error("react-use-echarts: merged ref callback threw on attach", error);
          continue;
        }
        if (typeof result === "function") {
          cleanups.push(result as () => void);
        } else {
          // Legacy callback ref — emulate cleanup by re-invoking with null.
          cleanups.push(() => {
            ref(null);
          });
        }
      } else {
        (ref as { current: T | null }).current = node;
        cleanups.push(() => {
          (ref as { current: T | null }).current = null;
        });
      }
    }
    return () => {
      // Isolate each cleanup: a thrown cleanup must not skip subsequent ones
      // (including the chart's setElement(null), which is what disposes the
      // ECharts instance — skipping it leaks the WeakMap entry).
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch (error) {
          console.error("react-use-echarts: merged ref cleanup threw on detach", error);
        }
      }
    };
  };
}
