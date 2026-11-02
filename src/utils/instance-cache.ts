import type { ECharts } from "echarts/core";
import { leaveGroup } from "./connect";

/**
 * Cache entry for ECharts instance
 * ECharts 实例缓存条目
 */
interface CacheEntry {
  instance: ECharts;
  refCount: number;
}

/**
 * ECharts instances by container element, reference-counted so hooks sharing
 * an element (or a StrictMode remount) don't dispose it early. A plain Map: an
 * entry lives until its last release anyway, and clearInstanceCache iterates it.
 * 按容器元素缓存的 ECharts 实例（引用计数）。条目在最后一次 release 前一直存在，
 * 且 clearInstanceCache 需要遍历，因此使用 Map。
 */
const instanceCache = new Map<HTMLElement, CacheEntry>();

/**
 * Get cached instance for element
 * 获取元素的缓存实例
 */
export function getCachedInstance(element: HTMLElement): ECharts | undefined {
  return instanceCache.get(element)?.instance;
}

/**
 * Cache `instance` for `element`, or bump the reference count of the instance
 * already cached there (which is returned).
 * 缓存实例，或为已缓存的实例增加引用计数（返回已缓存的实例）。
 */
export function setCachedInstance(element: HTMLElement, instance: ECharts): ECharts {
  const existing = instanceCache.get(element);

  if (existing) {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test" &&
      existing.instance !== instance
    ) {
      console.warn(
        "react-use-echarts: setCachedInstance called with a different instance for an already-cached element; " +
          "the new instance is ignored and the cached one is reused.",
      );
    }
    existing.refCount += 1;
    return existing.instance;
  }

  instanceCache.set(element, { instance, refCount: 1 });
  return instance;
}

/**
 * Disposal protocol: leave any group membership, then dispose. Every dispose
 * path goes through here so connect.ts' `groupMembers` never holds a stale
 * reference.
 * 集中表达"离组 + dispose"协议，避免 groupMembers 残留过期引用。
 */
function performDispose(instance: ECharts): void {
  try {
    leaveGroup(instance);
  } finally {
    // Dispose even if leaving fails: the caller evicts the entry either way, and
    // a live instance nothing tracks would leak in ECharts' own registry.
    instance.dispose();
  }
}

/**
 * Decrement reference count and dispose if zero
 * 减少引用计数，如果为零则销毁实例
 */
export function releaseCachedInstance(element: HTMLElement): void {
  const entry = instanceCache.get(element);
  if (!entry) return;

  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    // Evict even if dispose throws, so the next mount can't reuse a broken instance.
    try {
      performDispose(entry.instance);
    } finally {
      instanceCache.delete(element);
    }
  }
}

/**
 * Get reference count for element (0 if not cached)
 * 获取元素的引用计数（未缓存时为 0）
 */
export function getReferenceCount(element: HTMLElement): number {
  return instanceCache.get(element)?.refCount ?? 0;
}

/**
 * Clear all cached instances, disposing any that are still alive. Best-effort:
 * one failing dispose doesn't strand the rest.
 * 清除所有缓存实例，dispose 所有仍存活的实例；单个失败不影响其余实例。
 */
export function clearInstanceCache(): void {
  for (const { instance } of instanceCache.values()) {
    try {
      performDispose(instance);
    } catch {
      // Keep disposing the remaining entries.
    }
  }
  instanceCache.clear();
}
