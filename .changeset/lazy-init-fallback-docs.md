---
"react-use-echarts": patch
---

Document the `useLazyInit` fallback for malformed observer options. An out-of-range `threshold`, a unit-less `rootMargin`, or a non-Element `root` makes the `IntersectionObserver` constructor throw; the hook catches it, logs via `console.error`, and degrades to eager init so the chart still renders instead of staying blank. This was already the behavior — it is now described in the published type declarations and in both READMEs.

Also widened the `mergeRefs` description in the shipped `AGENTS.md` to cover React 19 cleanup-returning callback refs and the skipped `null` / `undefined` entries.

Documentation only — no runtime behavior change.
