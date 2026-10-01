/**
 * Error routing for chart operations.
 *
 * Callers pass the latest `onError`, read from a ref synced in a layout effect.
 * `useEffectEvent` is deliberately not used for this: React 19.2.x never
 * refreshes its callback inside memo() / forwardRef components (fixed in 19.3,
 * facebook/react#34831), so a memo-wrapped chart would keep calling the
 * `onError` from its first render.
 *
 * 图表操作的错误路由。调用方传入从 ref 读取的最新 onError；不使用 useEffectEvent，
 * 因为 React 19.2.x 在 memo() / forwardRef 组件中不会更新其回调（19.3 修复）。
 */

type OnError = ((error: unknown) => void) | undefined;

/**
 * Imperative API (setOption, dispatchAction, …): failures must surface — route
 * to `onError` when provided, otherwise rethrow to the caller.
 * 命令式 API：有 onError 时调用，否则 rethrow。
 */
export function routeImperativeError(error: unknown, onError: OnError): void {
  if (onError) {
    onError(error);
    return;
  }
  throw error;
}

/**
 * Effect context (init, option sync, resize, cleanup, …): a throw would
 * disrupt React's commit, so route to `onError` when provided, otherwise log.
 * effect 上下文：抛出会打断 React 提交，因此有 onError 时调用，否则 console.error。
 */
export function reportEffectError(error: unknown, onError: OnError, message: string): void {
  if (onError) onError(error);
  else console.error(message, error);
}
