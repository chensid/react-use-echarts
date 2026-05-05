import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Tracks the current element behind a stable RefObject across renders.
 *
 * Trade-off: re-checks `ref.current` after every commit because the
 * consumer-facing API is a `RefObject` (not a ref callback). Cost is one
 * equality check per commit; switching to a ref-callback API would change
 * the public hook signature.
 */
export function useRefElement<T extends Element>(ref: RefObject<T | null>): T | null {
  const [element, setElement] = useState<T | null>(() => ref.current);

  // Ref assignment happens during commit; check after every commit to catch replacements.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally polls ref.current after each commit
  useLayoutEffect(() => {
    if (element !== ref.current) {
      setElement(ref.current);
    }
  });

  return element;
}
