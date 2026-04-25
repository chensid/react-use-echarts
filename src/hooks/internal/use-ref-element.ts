import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Tracks the current element behind a stable RefObject across renders.
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
