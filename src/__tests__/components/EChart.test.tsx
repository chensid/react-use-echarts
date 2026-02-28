import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import * as echarts from "echarts";
import EChart from "../../components/EChart";
import { clearInstanceCache } from "../../utils/instance-cache";
import { clearGroups } from "../../utils/connect";
import type { UseEchartsReturn } from "../../types";

// Mock ECharts
vi.mock("echarts", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
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
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this);
  });
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

function createMockInstance(element?: HTMLElement) {
  return {
    setOption: vi.fn(),
    dispose: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDom: vi.fn(() => element),
    resize: vi.fn(),
  };
}

describe("EChart component", () => {
  beforeEach(() => {
    clearInstanceCache();
    clearGroups();
    vi.clearAllMocks();
  });

  it("should render a container div", () => {
    // Mock echarts.init to return a mock for any element
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    const { container } = render(
      <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />
    );

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(echarts.init).toHaveBeenCalled();
  });

  it("should apply default style (width 100%, height 400px)", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    const { container } = render(
      <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.style.width).toBe("100%");
    expect(div.style.height).toBe("400px");
  });

  it("should merge custom style with defaults", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    const { container } = render(
      <EChart
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
        style={{ height: "600px", border: "1px solid red" }}
      />
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.style.height).toBe("600px");
    expect(div.style.border).toBe("1px solid red");
    expect(div.style.width).toBe("100%");
  });

  it("should apply className", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    const { container } = render(
      <EChart
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
        className="my-chart"
      />
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.className).toBe("my-chart");
  });

  it("should expose chart methods via ref", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    const ref = createRef<UseEchartsReturn>();

    render(
      <EChart
        ref={ref}
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.setOption).toBe("function");
    expect(typeof ref.current!.getInstance).toBe("function");
    expect(typeof ref.current!.resize).toBe("function");
  });

  it("should pass options through to useEcharts", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el)
    );

    render(
      <EChart
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
        renderer="svg"
        theme="dark"
      />
    );

    expect(echarts.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      "dark",
      expect.objectContaining({ renderer: "svg" })
    );
  });
});
