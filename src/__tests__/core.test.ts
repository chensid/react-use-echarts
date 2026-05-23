import { describe, it, expect, vi } from "vite-plus/test";

// Since v2.1 `../core` is a deprecated alias of `../index` — both re-export
// the same set, neither side-effect imports `"echarts"`. This test guards
// against the alias drifting out of sync with the default entry.
vi.mock("echarts/core", () => ({
  init: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  registerTheme: vi.fn(),
}));

import * as core from "../core";
import * as main from "../index";

describe("react-use-echarts/core entry", () => {
  it("exposes the same public symbols as the default entry", () => {
    const coreKeys = new Set(Object.keys(core));
    const mainKeys = new Set(Object.keys(main));

    // Catch drift in either direction: any symbol added/removed in one entry
    // must be mirrored in the other, or the public surfaces diverge.
    expect(coreKeys).toEqual(mainKeys);
  });

  it("re-exports the documented runtime symbols", () => {
    // Sanity check the names users are documented to import. Keeps the smoke
    // test honest if someone accidentally swaps an `export {}` for a comment.
    expect(typeof core.useEcharts).toBe("function");
    expect(typeof core.EChart).toBe("function");
    expect(typeof core.useLazyInit).toBe("function");
    expect(typeof core.isBuiltinTheme).toBe("function");
    expect(typeof core.isKnownTheme).toBe("function");
    expect(typeof core.registerCustomTheme).toBe("function");
  });
});
