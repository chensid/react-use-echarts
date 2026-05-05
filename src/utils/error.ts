/**
 * Error routing utilities for chart instance operations.
 *
 * Two contexts with different fallbacks:
 * - effect: failures inside React effects can't throw (would break commit);
 *   fall back to console.error.
 * - imperative: failures from user-invoked methods must surface; fall back
 *   to rethrow so the caller's try/catch / promise rejection sees them.
 *
 * 图表操作的错误路由工具。effect 上下文回退 console.error；命令式上下文回退 rethrow。
 */

type OnError = ((error: unknown) => void) | undefined;

export function routeEffectError(error: unknown, message: string, onError: OnError): void {
  if (onError) {
    onError(error);
  } else {
    console.error(message, error);
  }
}

export function routeImperativeError(error: unknown, onError: OnError): void {
  if (onError) {
    onError(error);
    return;
  }
  throw error;
}
