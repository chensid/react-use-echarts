/**
 * Browser smoke test: tab visibility resync.
 *
 * The hook subscribes to `document.visibilitychange` so a chart whose tab was
 * backgrounded during a layout change still picks up the new size when the
 * tab returns. Asserting this in a real browser is tricky — `document.hidden`
 * is read-only and the actual visibility transition can't be forced from JS.
 * The visibility-coordinator unit test already covers the dispatch logic; this
 * file is a placeholder skipped by default and documents the gap so it can be
 * upgraded with a Playwright tab-toggle helper later.
 */
import { describe, it } from "vitest";

describe("visibilitychange resync in real browser", () => {
  it.skip("resyncs chart size after tab returns to foreground", () => {
    // Skipped: no reliable way to fake `document.visibilitychange` from a
    // running test page. Coordinator-level coverage lives in
    // src/__tests__/utils/visibility-coordinator.test.ts. Revisit when
    // Playwright exposes a stable hook for tab visibility transitions
    // (e.g. CDP `Emulation.setVisibilityState`).
  });
});
