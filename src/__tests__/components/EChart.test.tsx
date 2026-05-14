import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { render } from "@testing-library/react";
import { createRef } from "react";
import * as echarts from "echarts/core";
import EChart from "../../components/EChart";
import { clearInstanceCache, getCachedInstance } from "../../utils/instance-cache";
import { clearGroups } from "../../utils/connect";
import type { UseEchartsReturn } from "../../types";
import { createMockInstance, MockResizeObserver, MockIntersectionObserver } from "../helpers";

// Mock ECharts
vi.mock("echarts/core", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe("EChart component", () => {
  beforeEach(() => {
    clearInstanceCache();
    clearGroups();
    vi.clearAllMocks();
  });

  it("should render a container div", () => {
    // Mock echarts.init to return a mock for any element
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const { container } = render(
      <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />,
    );

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(echarts.init).toHaveBeenCalled();
  });

  it("should apply default style (width 100%, height 100%)", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const { container } = render(
      <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />,
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.style.width).toBe("100%");
    expect(div.style.height).toBe("100%");
    expect(div.style.minHeight).toBe("");
  });

  it("should merge custom style with defaults", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const { container } = render(
      <EChart
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
        style={{ height: "600px", border: "1px solid red" }}
      />,
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.style.height).toBe("600px");
    expect(div.style.border).toBe("1px solid red");
    expect(div.style.width).toBe("100%");
  });

  it("should apply className", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const { container } = render(
      <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} className="my-chart" />,
    );

    const div = container.firstChild as HTMLDivElement;
    expect(div.className).toBe("my-chart");
  });

  it("should expose chart methods via ref", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const ref = createRef<UseEchartsReturn>();

    render(<EChart ref={ref} option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.setOption).toBe("function");
    expect(typeof ref.current!.getInstance).toBe("function");
    expect(typeof ref.current!.resize).toBe("function");
    expect(typeof ref.current!.dispatchAction).toBe("function");
    expect(typeof ref.current!.clear).toBe("function");
  });

  it("should forward dispatchAction and clear via ref", () => {
    let captured: ReturnType<typeof createMockInstance> | null = null;
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) => {
      captured = createMockInstance(el);
      return captured;
    });

    const ref = createRef<UseEchartsReturn>();

    render(<EChart ref={ref} option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />);

    ref.current!.dispatchAction({ type: "highlight" });
    ref.current!.clear();

    expect(captured!.dispatchAction).toHaveBeenCalledWith({ type: "highlight" }, undefined);
    expect(captured!.clear).toHaveBeenCalled();
  });

  it("should pass options through to useEcharts", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    render(
      <EChart
        option={{ series: [{ type: "line", data: [1, 2, 3] }] }}
        renderer="svg"
        theme="dark"
      />,
    );

    expect(echarts.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      "dark",
      expect.objectContaining({ renderer: "svg" }),
    );
  });

  it("should reuse memoized values on re-render with stable props", () => {
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((el: HTMLElement) =>
      createMockInstance(el),
    );

    const option = { series: [{ type: "line" as const, data: [1, 2, 3] }] };
    const style = { height: 400 };
    const { rerender, container } = render(<EChart option={option} style={style} className="c" />);
    const firstChild = container.firstChild;
    rerender(<EChart option={option} style={style} className="c" />);
    expect(container.firstChild).toBe(firstChild);
    expect(echarts.init).toHaveBeenCalledTimes(1);
  });

  it("should dispose instance on unmount and clear cache entry", () => {
    const dispose = vi.fn();
    let cachedElement: HTMLElement | null = null;
    const mockInstance = {
      ...createMockInstance(document.createElement("div")),
      dispose,
    };
    (echarts.init as ReturnType<typeof vi.fn>).mockImplementation((element: HTMLElement) => {
      cachedElement = element;
      return mockInstance;
    });

    const { unmount } = render(<EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />);

    expect(cachedElement).toBeInstanceOf(HTMLDivElement);
    expect(getCachedInstance(cachedElement!)).toBe(mockInstance);
    expect(dispose).not.toHaveBeenCalled();

    unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(getCachedInstance(cachedElement!)).toBeUndefined();
  });
});
