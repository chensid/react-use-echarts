import React, { useEffect, useMemo, useRef, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { useTheme } from "./theme-context";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  readonly code: string;
  readonly language: "tsx";
}

type MinimalHighlighter = {
  codeToHtml: (sourceCode: string, options: { lang: string; theme: string }) => string;
};

let highlighterPromise: Promise<MinimalHighlighter> | null = null;

const getHighlighter = async (): Promise<MinimalHighlighter> => {
  highlighterPromise ??= createHighlighterCore({
    themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
    langs: [import("@shikijs/langs/tsx")],
    engine: createJavaScriptRegexEngine(),
  }).then((highlighter) => ({
    codeToHtml: (sourceCode, options) =>
      highlighter.codeToHtml(sourceCode, {
        lang: options.lang,
        theme: options.theme,
      }),
  }));

  return highlighterPromise;
};

const highlightCode = async (code: string, language: string, theme: string): Promise<string> => {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, { lang: language, theme });
};

const clearCopyReset = (timeoutRef: React.RefObject<number | undefined>): void => {
  if (timeoutRef.current === undefined) return;
  window.clearTimeout(timeoutRef.current);
  timeoutRef.current = undefined;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const { mode } = useTheme();
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied">("Copy");
  const resetCopyLabelTimeoutRef = useRef<number | undefined>(undefined);

  const theme = useMemo(() => (mode === "dark" ? "github-dark" : "github-light"), [mode]);

  useEffect(() => {
    let disposed = false;

    highlightCode(code, language, theme)
      .then((html) => {
        if (!disposed) {
          setHighlightedHtml(html);
        }
      })
      .catch(() => {
        if (!disposed) {
          setHighlightedHtml("");
        }
      });

    return () => {
      disposed = true;
    };
  }, [code, language, theme]);

  useEffect(
    () => () => {
      clearCopyReset(resetCopyLabelTimeoutRef);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel("Copied");
      clearCopyReset(resetCopyLabelTimeoutRef);
      resetCopyLabelTimeoutRef.current = window.setTimeout(() => {
        setCopyLabel("Copy");
        resetCopyLabelTimeoutRef.current = undefined;
      }, 1200);
    } catch {
      setCopyLabel("Copy");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.lang}>{language}</span>
        <button type="button" className="btn" onClick={handleCopy}>
          {copyLabel}
        </button>
      </div>
      <div className={styles.block}>
        {highlightedHtml ? (
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <pre className={styles.fallback}>{code}</pre>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;
