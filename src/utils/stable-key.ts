/**
 * Stable identity keys for values used as effect dependencies.
 * Produces a string that is equal across renders for equivalent values,
 * so inline objects do not spuriously re-trigger effects.
 * 为 effect 依赖生成稳定标识键：对相同内容的对象在多次渲染间返回同一字符串，
 * 避免内联对象触发不必要的 effect 重跑。
 */

const CIRCULAR_PREFIX = "__circular_";

// Stable IDs for objects that cannot be JSON-serialized (e.g. circular references).
// Each object gets a unique string via crypto.randomUUID, stored in a WeakMap so
// the same object consistently maps to the same id.
const circularObjectIds = new WeakMap<object, string>();

function getCircularObjectId(obj: object): string {
  let id = circularObjectIds.get(obj);
  if (!id) {
    id = `${CIRCULAR_PREFIX}${crypto.randomUUID()}`;
    circularObjectIds.set(obj, id);
  }
  return id;
}

/**
 * Compute a stable identity key for a value.
 * Strings pass through; numbers coerce via `String(...)`; objects are
 * JSON-serialized (circular ones fall back to a WeakMap-assigned id);
 * nullish and other unsupported types return null.
 */
export function computeStableKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value !== "object") return null;
  try {
    return JSON.stringify(value);
  } catch {
    return getCircularObjectId(value);
  }
}

/**
 * Whether `key` is a WeakMap-assigned fallback id produced for a circular object.
 * Callers use this to decide whether the key carries serializable content.
 */
export function isCircularFallbackKey(key: string): boolean {
  return key.startsWith(CIRCULAR_PREFIX);
}
