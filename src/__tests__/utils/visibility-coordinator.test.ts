import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import {
  subscribeVisibilityResume,
  __resetVisibilityCoordinatorForTesting__,
} from "../../utils/visibility-coordinator";

describe("visibility-coordinator", () => {
  beforeEach(() => {
    __resetVisibilityCoordinatorForTesting__();
  });

  it("attaches a single document listener regardless of subscriber count", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    const unsub1 = subscribeVisibilityResume(() => {});
    const unsub2 = subscribeVisibilityResume(() => {});
    const unsub3 = subscribeVisibilityResume(() => {});

    const visibilityAdds = addSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
    expect(visibilityAdds).toHaveLength(1);

    unsub1();
    unsub2();
    unsub3();
    addSpy.mockRestore();
  });

  it("removes the document listener only after the last subscriber leaves", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const unsub1 = subscribeVisibilityResume(() => {});
    const unsub2 = subscribeVisibilityResume(() => {});

    unsub1();
    let visibilityRemoves = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
    expect(visibilityRemoves).toHaveLength(0);

    unsub2();
    visibilityRemoves = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
    expect(visibilityRemoves).toHaveLength(1);

    removeSpy.mockRestore();
  });

  it("fires subscribers only when the tab becomes visible", () => {
    // Mock on the instance — happy-dom defines `hidden` as an own property on
    // `document`, which shadows any Document.prototype getter we'd install.
    const ownDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
    let hidden = false;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });

    try {
      const cb = vi.fn();
      subscribeVisibilityResume(cb);

      hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
      expect(cb).not.toHaveBeenCalled();

      hidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
      expect(cb).toHaveBeenCalledTimes(1);
    } finally {
      if (ownDescriptor) {
        Object.defineProperty(document, "hidden", ownDescriptor);
      } else {
        delete (document as unknown as { hidden?: boolean }).hidden;
      }
    }
  });

  it("isolates a throwing subscriber so later subscribers still fire", () => {
    const ownDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
    let hidden = true;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const throwing = vi.fn(() => {
        throw new Error("subscriber boom");
      });
      const after = vi.fn();
      // Insertion order = iteration order, so `throwing` runs before `after`.
      subscribeVisibilityResume(throwing);
      subscribeVisibilityResume(after);

      hidden = false;
      // The dispatch itself must not throw, and the throwing subscriber must
      // not starve the one registered after it.
      expect(() => document.dispatchEvent(new Event("visibilitychange"))).not.toThrow();

      expect(throwing).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      if (ownDescriptor) {
        Object.defineProperty(document, "hidden", ownDescriptor);
      } else {
        delete (document as unknown as { hidden?: boolean }).hidden;
      }
    }
  });

  it("__resetForTesting__ detaches an active listener", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");

    // Make the coordinator attach a listener.
    subscribeVisibilityResume(() => {});

    // Reset while attached — covers the cleanup branch.
    __resetVisibilityCoordinatorForTesting__();

    const visibilityRemoves = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
    expect(visibilityRemoves).toHaveLength(1);

    // Reset again while detached — should be a no-op (no extra removeEventListener).
    __resetVisibilityCoordinatorForTesting__();
    const stillOne = removeSpy.mock.calls.filter((c) => c[0] === "visibilitychange");
    expect(stillOne).toHaveLength(1);

    removeSpy.mockRestore();
  });
});
