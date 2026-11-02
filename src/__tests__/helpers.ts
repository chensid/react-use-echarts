import { vi } from "vite-plus/test";

export function createMockInstance(element?: HTMLElement) {
  return {
    setOption: vi.fn(),
    dispose: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDom: vi.fn(() => element),
    resize: vi.fn(),
    isDisposed: vi.fn(() => false),
    dispatchAction: vi.fn(),
    clear: vi.fn(),
    appendData: vi.fn(),
    getOption: vi.fn(() => ({})),
    getWidth: vi.fn(() => 400),
    getHeight: vi.fn(() => 300),
    getDataURL: vi.fn(() => "data:image/png;base64,mock"),
    getConnectedDataURL: vi.fn(() => "data:image/png;base64,connected-mock"),
    renderToSVGString: vi.fn(() => "<svg></svg>"),
    getSvgDataURL: vi.fn(() => "data:image/svg+xml;base64,svg-mock"),
    convertToPixel: vi.fn(() => [10, 20]),
    convertToLayout: vi.fn(() => ({ rect: { x: 0, y: 0, width: 10, height: 10 } })),
    convertFromPixel: vi.fn(() => [1, 2]),
    containPixel: vi.fn(() => false),
  };
}

export class MockResizeObserver {
  callback: ResizeObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
}

export class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
  root: Document | Element | null = null;
  rootMargin = "0px";
  thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn(() => {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  });
}

/**
 * The proxy the hook registered via `on(eventName, …)` (the n-th such call,
 * last by default). The hook binds proxies that forward to the latest
 * `onEvents` handler, so tests invoke this instead of matching the handler.
 */
export function boundProxy(
  instance: ReturnType<typeof createMockInstance>,
  eventName: string,
  nth = -1,
): (this: unknown, params: unknown) => void {
  const call = instance.on.mock.calls.filter((args) => args[0] === eventName).at(nth);
  if (!call) throw new Error(`no on("${eventName}", …) call recorded`);
  return call[call.length - 2] as (this: unknown, params: unknown) => void;
}

/**
 * Run `fn` with `process.env.NODE_ENV` set to `env` (e.g. to exercise dev-only
 * warnings), restoring the previous value even if `fn` throws. Sync only: an
 * async `fn` would see the old value again after its first `await`.
 */
export function withNodeEnv(env: string, fn: () => void): void {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  try {
    fn();
  } finally {
    process.env.NODE_ENV = previous;
  }
}
