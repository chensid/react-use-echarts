/**
 * Stable identity keys for values used as effect dependencies.
 * Produces a string that is equal across renders for equivalent values,
 * so inline objects do not spuriously re-trigger effects.
 * 为 effect 依赖生成稳定标识键：对相同内容的对象在多次渲染间返回同一字符串，
 * 避免内联对象触发不必要的 effect 重跑。
 */

/**
 * Per-object IDs for values that JSON.stringify cannot handle (circular
 * references, BigInt, etc.). Same reference → same ID; distinct references
 * → distinct IDs, so the documented "object changes recreate instance"
 * contract still holds for non-serializable values.
 * 对 JSON 无法序列化的值（循环引用、BigInt 等），以引用为粒度分配唯一 ID，
 * 保证「对象变化会重建实例」的文档契约在这些值上仍然成立。
 */
const nonSerializableIds = new WeakMap<object, string>();
let nonSerializableIdCounter = 0;

function getNonSerializableId(obj: object): string {
  let id = nonSerializableIds.get(obj);
  if (!id) {
    id = `__nonserializable_${nonSerializableIdCounter++}`;
    nonSerializableIds.set(obj, id);
  }
  return id;
}

/**
 * Compute a stable identity key for a value.
 * Strings pass through; numbers coerce via `String(...)`; objects are
 * JSON-serialized (or assigned a per-reference ID when not serializable);
 * nullish and unsupported primitives return null.
 */
export function computeStableKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value !== "object") return null;
  try {
    return JSON.stringify(value);
  } catch {
    return getNonSerializableId(value);
  }
}
