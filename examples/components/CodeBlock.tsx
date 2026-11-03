import React, { useEffect, useMemo, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { useTheme } from "./theme-context";
import { useCopy } from "./use-copy";
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

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const { mode } = useTheme();
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const { copied, copy } = useCopy(1200);

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.lang}>{language}</span>
        <button type="button" className="btn" onClick={() => void copy(code)}>
          {copied ? "Copied" : "Copy"}
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
