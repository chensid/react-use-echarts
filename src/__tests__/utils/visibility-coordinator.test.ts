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
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");
    let hidden = false;
    Object.defineProperty(Document.prototype, "hidden", {
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
      if (originalDescriptor) {
        Object.defineProperty(Document.prototype, "hidden", originalDescriptor);
      } else {
        delete (Document.prototype as unknown as { hidden?: boolean }).hidden;
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
