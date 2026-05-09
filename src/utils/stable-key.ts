/**
 * Stable identity keys for values used as effect dependencies.
 * Produces a string that is equal across renders for equivalent values,
 * so inline objects do not spuriously re-trigger effects.
 * 为 effect 依赖生成稳定标识键：对相同内容的对象在多次渲染间返回同一字符串，
 * 避免内联对象触发不必要的 effect 重跑。
 */

/**
 * Compute a stable identity key for a value.
 * Strings pass through; numbers coerce via `String(...)`; objects are
 * JSON-serialized; nullish, unsupported primitives, and values that cannot
 * be JSON-serialized (circular refs, BigInt) all return null.
 */
export function computeStableKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value !== "object") return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
