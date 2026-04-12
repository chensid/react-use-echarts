/**
 * Route error to onError callback or console.error.
 * Used inside effects where throwing is not safe.
 * 将错误路由到 onError 回调或 console.error。
 * 用于 effect 内部不适合 throw 的场景。
 */
export function logError(
  error: unknown,
  message: string,
  onError: ((e: unknown) => void) | undefined,
): void {
  if (onError) {
    onError(error);
  } else {
    console.error(message, error);
  }
}
