import React, { useEffect, useMemo, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemeMode } from "./Header";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  readonly code: string;
  readonly language: "tsx";
  readonly themeMode: ThemeMode;
}

type MinimalHighlighter = {
  codeToHtml: (sourceCode: string, options: { lang: string; theme: string }) => string;
};

let highlighterPromise: Promise<MinimalHighlighter> | null = null;

const getHighlighter = async (): Promise<MinimalHighlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
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
  }

  return highlighterPromise;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, themeMode }) => {
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied">("Copy");

  const theme = useMemo(() => (themeMode === "dark" ? "github-dark" : "github-light"), [themeMode]);

  useEffect(() => {
    let disposed = false;

    const renderCode = async () => {
      const highlighter = await getHighlighter();
      const html = highlighter.codeToHtml(code, { lang: language, theme });

      if (!disposed) {
        setHighlightedHtml(html);
      }
    };

    renderCode().catch(() => {
      if (!disposed) {
        setHighlightedHtml("");
      }
    });

    return () => {
      disposed = true;
    };
  }, [code, language, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1200);
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
