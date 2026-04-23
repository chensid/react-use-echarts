/**
 * Dev-only warning dedup sets.
 * Module-level singletons so repeated renders / recreated instances only warn once.
 * dev-only 警告去重集合：跨渲染共享的 module 级单例，保证同一情况只警告一次。
 */

export const warnedThemeNames = new Set<string>();
export const warnedZeroSizeContainers = new WeakSet<HTMLElement>();

/**
 * Reset dev warning state (for testing).
 * WeakSet has no .clear(); its entries are collected with the element.
 */
export function resetDevWarnings(): void {
  warnedThemeNames.clear();
}
