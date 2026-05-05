/**
 * Module-level coordinator for `document.visibilitychange` resume callbacks.
 * One DOM listener regardless of subscriber count; attaches lazily on first
 * subscriber, detaches on last unsubscribe.
 *
 * 模块级 visibilitychange 协调器：单 listener + 多订阅者，按需挂载/卸载。
 */

const subscribers = new Set<() => void>();
let attached = false;

function onVisibilityChange(): void {
  if (document.hidden) return;
  for (const cb of subscribers) cb();
}

/**
 * Subscribe a callback to fire when the tab returns to the foreground.
 * Returns an unsubscribe function.
 */
export function subscribeVisibilityResume(cb: () => void): () => void {
  subscribers.add(cb);
  if (!attached) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    attached = true;
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && attached) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      attached = false;
    }
  };
}

/**
 * Reset coordinator state (for testing). Drops all subscribers and the
 * document listener so each test starts from a clean slate.
 */
export function __resetVisibilityCoordinatorForTesting__(): void {
  if (attached) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    attached = false;
  }
  subscribers.clear();
}
