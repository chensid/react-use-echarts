import { useEffect, useRef, useState } from "react";

const clearTimer = (timerRef: React.RefObject<number | undefined>): void => {
  window.clearTimeout(timerRef.current);
  timerRef.current = undefined;
};

/**
 * Copies text to the clipboard and reports `copied` for `resetMs`. Copying
 * again restarts the timer, and unmounting clears it.
 */
export function useCopy(resetMs: number): {
  readonly copied: boolean;
  readonly copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimer(timerRef), []);

  const copy = async (text: string) => {
    clearTimer(timerRef);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setCopied(false);
      return;
    }
    setCopied(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      setCopied(false);
    }, resetMs);
  };

  return { copied, copy };
}
