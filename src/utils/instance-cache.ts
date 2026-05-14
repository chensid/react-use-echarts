import type { ECharts } from "echarts/core";
import { leaveGroup } from "./connect";

/**
 * Cache entry for ECharts instance
 * ECharts 实例缓存条目
 */
interface CacheEntry {
  /** ECharts instance */
  instance: ECharts;
  /** Reference count */
  refCount: number;
}

/**
 * Global cache for ECharts instances using WeakMap
 * 使用 WeakMap 的全局 ECharts 实例缓存
 * Key: HTMLElement, Value: CacheEntry
 */
let instanceCache = new WeakMap<HTMLElement, CacheEntry>();

/**
 * Parallel set to track cached elements for safe iteration on clear.
 * WeakMap cannot be enumerated, so this Set allows clearInstanceCache
 * to dispose all live instances before resetting the cache.
 * 平行集合，用于在清除时安全遍历。WeakMap 无法枚举，
 * 此 Set 使 clearInstanceCache 能在重置缓存前 dispose 所有存活实例。
 */
const trackedElements = new Set<HTMLElement>();

/**
 * Get cached instance for element
 * 获取元素的缓存实例
 * @param element DOM element
 * @returns Cached instance or undefined
 */
export function getCachedInstance(element: HTMLElement): ECharts | undefined {
  return instanceCache.get(element)?.instance;
}

/**
 * Set or increment reference count for instance
 * 设置实例或增加引用计数
 * @param element DOM element
 * @param instance ECharts instance
 * @returns The instance (cached or new)
 */
export function setCachedInstance(element: HTMLElement, instance: ECharts): ECharts {
  const existing = instanceCache.get(element);

  if (existing) {
    if (process.env.NODE_ENV !== "production" && existing.instance !== instance) {
      console.warn(
        "react-use-echarts: setCachedInstance called with a different instance for an already-cached element; " +
          "the new instance is ignored and the cached one is reused.",
      );
    }
    // Increment reference count
    existing.refCount += 1;
    return existing.instance;
  } else {
    // Create new cache entry
    instanceCache.set(element, {
      instance,
      refCount: 1,
    });
    trackedElements.add(element);
    return instance;
  }
}

/**
 * Disposal protocol: leave any group membership, then dispose the instance.
 * Centralized so all dispose entry points (releaseCachedInstance,
 * clearInstanceCache) drop group ownership before tearing down — otherwise
 * groupRegistry holds stale references that only get pruned lazily.
 * 集中表达"离组 + dispose"协议，避免 groupRegistry 残留过期引用。
 */
function performDispose(instance: ECharts): void {
  leaveGroup(instance);
  instance.dispose();
}

/**
 * Decrement reference count and dispose if zero
 * 减少引用计数，如果为零则销毁实例
 * @param element DOM element
 */
export function releaseCachedInstance(element: HTMLElement): void {
  const entry = instanceCache.get(element);

  if (!entry) {
    return;
  }

  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    // Cache bookkeeping must run even if dispose unexpectedly throws —
    // otherwise a stale entry would survive and the next mount could reuse
    // a broken instance.
    try {
      performDispose(entry.instance);
    } finally {
      instanceCache.delete(element);
      trackedElements.delete(element);
    }
  }
}

/**
 * Get reference count for element
 * 获取元素的引用计数
 * @param element DOM element
 * @returns Reference count or 0 if not cached
 */
export function getReferenceCount(element: HTMLElement): number {
  return instanceCache.get(element)?.refCount ?? 0;
}

/**
 * Clear all cached instances, disposing any that are still alive.
 * 清除所有缓存实例，dispose 所有仍存活的实例。
 */
export function clearInstanceCache(): void {
  // Best-effort: a single performDispose failure must not strand the rest,
  // and the outer finally guarantees the cache resets so test isolation
  // holds even if an instance throws while disposing.
  try {
    for (const element of trackedElements) {
      try {
        // trackedElements and instanceCache are always in sync,
        // so the entry is guaranteed to exist here.
        performDispose(instanceCache.get(element)!.instance);
      } catch {
        // Swallow per-instance failure; continue disposing remaining entries.
      }
    }
  } finally {
    trackedElements.clear();
    instanceCache = new WeakMap<HTMLElement, CacheEntry>();
  }
}
