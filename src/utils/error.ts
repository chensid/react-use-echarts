/**
 * Error routing for imperative chart-API calls.
 *
 * Failures from user-invoked methods (setOption, dispatchAction, …) must
 * surface; with `onError`, route the error; without, rethrow so the caller's
 * try/catch / promise rejection sees it.
 *
 * Effect-context error routing lives inside each effect hook via React's
 * `useEffectEvent` (`handleEffectError` / `handleResizeError`) so the latest
 * `onError` is always reached without a ref-sync bridge.
 *
 * 命令式 API 的错误路由：有 onError 时调用，否则 rethrow；effect 路由由各 hook
 * 内部的 `useEffectEvent` 直接处理。
 */

type OnError = ((error: unknown) => void) | undefined;

export function routeImperativeError(error: unknown, onError: OnError): void {
  if (onError) {
    onError(error);
    return;
  }
  throw error;
}
