/**
 * Shallow equality: `Object.is` for primitives; for objects, the same own
 * enumerable keys with `Object.is`-equal values.
 * 两个值的浅比较。
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  const objB = b as Record<string, unknown>;
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
}
