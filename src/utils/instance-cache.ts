import type { ECharts } from "echarts";

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
const instanceCache = new WeakMap<HTMLElement, CacheEntry>();

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
    // Increment reference count
    existing.refCount += 1;
    return existing.instance;
  } else {
    // Create new cache entry
    instanceCache.set(element, {
      instance,
      refCount: 1,
    });
    return instance;
  }
}

/**
 * Replace cached instance (for theme changes)
 * 替换缓存实例（用于主题切换）
 * @param element DOM element
 * @param instance New ECharts instance
 * @returns The new instance
 */
export function replaceCachedInstance(element: HTMLElement, instance: ECharts): ECharts {
  const existing = instanceCache.get(element);

  if (existing) {
    // Replace the instance but keep the ref count
    // 替换实例但保持引用计数
    existing.instance = instance;
    return instance;
  } else {
    // Create new cache entry
    instanceCache.set(element, {
      instance,
      refCount: 1,
    });
    return instance;
  }
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
    // Dispose instance and remove from cache
    entry.instance.dispose();
    instanceCache.delete(element);
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
 * Clear all cached instances (for testing/cleanup)
 * 清除所有缓存实例（用于测试/清理）
 */
export function clearInstanceCache(): void {
  // Note: WeakMap doesn't have clear method, entries will be garbage collected
  // when elements are removed from DOM
}
