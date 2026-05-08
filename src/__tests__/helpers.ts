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
