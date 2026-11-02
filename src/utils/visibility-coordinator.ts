/**
 * Module-level coordinator for `document.visibilitychange` resume callbacks.
 * One DOM listener regardless of subscriber count, attached exactly while
 * there are subscribers.
 *
 * 模块级 visibilitychange 协调器：单 listener + 多订阅者，按需挂载/卸载。
 */

const subscribers = new Set<() => void>();

function onVisibilityChange(): void {
  if (document.hidden) return;
  // Isolate subscribers: one throwing callback (e.g. a consumer `onError` that
  // rethrows from the resize path) must not skip the other charts' resync.
  for (const cb of subscribers) {
    try {
      cb();
    } catch (error) {
      console.error("react-use-echarts: visibilitychange subscriber threw", error);
    }
  }
}

/**
 * Subscribe a callback to fire when the tab returns to the foreground.
 * Returns an unsubscribe function.
 */
export function subscribeVisibilityResume(cb: () => void): () => void {
  if (subscribers.size === 0) {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  subscribers.add(cb);
  return () => {
    if (subscribers.delete(cb) && subscribers.size === 0) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

/**
 * Reset coordinator state (for testing). Drops all subscribers and the
 * document listener so each test starts from a clean slate.
 */
export function __resetVisibilityCoordinatorForTesting__(): void {
  if (subscribers.size > 0) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  subscribers.clear();
}
